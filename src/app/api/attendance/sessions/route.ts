import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { apiCreated, badRequest, conflict, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { ClassModel } from "@/models/Class";
import { DeviceModel } from "@/models/Device";
import { StudentModel } from "@/models/Student";
import { startSessionSchema } from "@/lib/validations";
import { todayKey } from "@/lib/utils";

/** Start a new attendance session for a class (one active/submitted session per class per day). */
export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await parseJsonBody(request);
  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  try {
    const { classId, date } = parsed.data;
    const dateKey = date || todayKey();

    const cls = await ClassModel.findById(classId).populate<{
      teacherId: { _id: Types.ObjectId };
    }>("teacherId", "_id");
    if (!cls) return notFound("Class");

    if (
      session.user.role === "TEACHER" &&
      session.user.teacherId &&
      cls.teacherId._id.toString() !== session.user.teacherId
    ) {
      return badRequest("You are not assigned to this class.");
    }

    // Duplicate protection: no second session for the same class on the same day.
    const existing = await AttendanceSessionModel.findOne({ classId, date: dateKey });
    if (existing) {
      if (existing.status === "SUBMITTED") {
        return conflict("Attendance for this class has already been submitted today.");
      }
      return conflict(
        "An attendance session is already active for this class today. Open it to continue."
      );
    }

    if (!cls.studentIds || cls.studentIds.length === 0) {
      return badRequest("This class has no students enrolled. Add students first.");
    }

    // Snapshot the roster so history stays correct even if profiles change later.
    const students = await StudentModel.find({ _id: { $in: cls.studentIds } })
      .sort({ studentId: 1 })
      .lean();

    if (students.length === 0) {
      return badRequest("No active students found for this class.");
    }

    const teacherObjectId = session.user.teacherId ?? cls.teacherId._id;

    const newSession = await AttendanceSessionModel.create({
      classId: cls._id,
      courseId: cls.courseId,
      teacherId: teacherObjectId,
      date: dateKey,
      startedAt: new Date(),
      status: "ACTIVE",
      deviceId: cls.deviceId ?? null,
      students: students.map((s) => ({
        studentId: s._id,
        studentIdSnapshot: s.studentId,
        studentNameSnapshot: s.name,
        status: null,
        markedAt: null,
      })),
    });

    // Notify the assigned ESP32 display.
    if (cls.deviceId) {
      await DeviceModel.updateOne(
        { _id: cls.deviceId, status: "ACTIVE" },
        {
          $push: {
            commands: {
              type: "ATTENDANCE_STARTED",
              sessionId: newSession._id.toString(),
              message: "Attendance started",
              createdAt: new Date(),
            },
          },
        }
      );
    }

    const populated = await AttendanceSessionModel.findById(newSession._id)
      .populate("courseId", "code name")
      .populate("classId", "name room")
      .lean();

    return apiCreated(populated, "Attendance session started");
  } catch {
    return serverError();
  }
}
