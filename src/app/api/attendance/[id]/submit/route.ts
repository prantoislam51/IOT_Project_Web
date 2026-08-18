import { NextRequest } from "next/server";
import { apiOk, badRequest, conflict, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { AttendanceRecordModel } from "@/models/AttendanceRecord";
import { DeviceModel } from "@/models/Device";
import { submitAttendanceSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * Submit attendance: validates every student is marked, persists records
 * atomically-ish, flips session to SUBMITTED and queues the ESP32 command.
 * Idempotency: a SUBMITTED session can never be submitted again.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = submitAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid submission.");
  }

  try {
    const attendanceSession = await AttendanceSessionModel.findById(id);
    if (!attendanceSession) return notFound("Attendance session");

    if (
      session.user.role === "TEACHER" &&
      session.user.teacherId &&
      attendanceSession.teacherId.toString() !== session.user.teacherId
    ) {
      return badRequest("You are not allowed to submit this session.");
    }

    // Duplicate submission protection.
    if (attendanceSession.status === "SUBMITTED") {
      return conflict("This attendance has already been submitted.");
    }

    // Apply incoming statuses.
    const statusMap = new Map(parsed.data.statuses.map((s) => [s.studentId, s.status]));
    const known = new Set(attendanceSession.students.map((s) => s.studentId.toString()));
    for (const studentId of statusMap.keys()) {
      if (!known.has(studentId)) {
        return badRequest("One or more students do not belong to this class.");
      }
    }
    const now = new Date();
    for (const entry of attendanceSession.students) {
      const next = statusMap.get(entry.studentId.toString());
      if (next) {
        entry.status = next;
        if (!entry.markedAt) entry.markedAt = now;
      }
    }

    // Every student must have a final status.
    const unmarked = attendanceSession.students.filter((s) => !s.status);
    if (unmarked.length > 0) {
      return badRequest(
        `${unmarked.length} student(s) are still unmarked. Mark every student before submitting.`
      );
    }

    attendanceSession.status = "SUBMITTED";
    attendanceSession.submittedAt = now;

    const docs = attendanceSession.students.map((entry) => ({
      sessionId: attendanceSession._id,
      classId: attendanceSession.classId,
      courseId: attendanceSession.courseId,
      teacherId: attendanceSession.teacherId,
      studentId: entry.studentId,
      studentIdSnapshot: entry.studentIdSnapshot,
      studentNameSnapshot: entry.studentNameSnapshot,
      status: entry.status,
      date: attendanceSession.date,
      markedAt: entry.markedAt,
    }));

    // Guard against record duplicates (retry-safe): remove then re-insert.
    await AttendanceRecordModel.deleteMany({ sessionId: attendanceSession._id });
    await AttendanceRecordModel.insertMany(docs);

    await attendanceSession.save();

    // Queue the success command for the assigned ESP32 display.
    if (attendanceSession.deviceId) {
      await DeviceModel.updateOne(
        { _id: attendanceSession.deviceId, status: "ACTIVE" },
        {
          $push: {
            commands: {
              type: "ATTENDANCE_COMPLETED",
              sessionId: attendanceSession._id.toString(),
              message: "Attendance Successful",
              createdAt: new Date(),
            },
          },
        }
      );
    }

    const present = attendanceSession.students.filter((s) => s.status === "PRESENT").length;
    const absent = attendanceSession.students.length - present;

    return apiOk(
      {
        sessionId: attendanceSession._id,
        present,
        absent,
        total: attendanceSession.students.length,
      },
      "Attendance submitted successfully"
    );
  } catch {
    return serverError();
  }
}
