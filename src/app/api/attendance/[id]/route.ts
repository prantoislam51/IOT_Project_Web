import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { apiOk, badRequest, conflict, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { updateAttendanceSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  try {
    const attendanceSession = await AttendanceSessionModel.findById(id)
      .populate("courseId", "code name credits section")
      .populate("classId", "name room section startTime endTime")
      .populate("teacherId", "name email")
      .populate("deviceId", "deviceId name status lastSeen");
    if (!attendanceSession) return notFound("Attendance session");

    await assertTeacherOwnsSession(session, attendanceSession.teacherId);
    return apiOk(attendanceSession, "Attendance session retrieved");
  } catch (err) {
    if (err instanceof Response) return err;
    return serverError();
  }
}

/** Autosave — update individual student statuses while the session is active. */
export async function PUT(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = updateAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid attendance data.");
  }

  try {
    const attendanceSession = await AttendanceSessionModel.findById(id);
    if (!attendanceSession) return notFound("Attendance session");

    await assertTeacherOwnsSession(session, attendanceSession.teacherId);

    if (attendanceSession.status === "SUBMITTED") {
      return conflict("This attendance has already been submitted and cannot be modified.");
    }

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
      if (next && next !== entry.status) {
        entry.status = next;
        entry.markedAt = now;
      }
    }

    attendanceSession.status = attendanceSession.status === "DRAFT" ? "ACTIVE" : attendanceSession.status;
    await attendanceSession.save();

    return apiOk(attendanceSession.toJSON(), "Attendance updated");
  } catch (err) {
    if (err instanceof Response) return err;
    return serverError();
  }
}

/** Cancel an unsubmitted session. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  try {
    const attendanceSession = await AttendanceSessionModel.findById(id);
    if (!attendanceSession) return notFound("Attendance session");

    await assertTeacherOwnsSession(session, attendanceSession.teacherId);

    if (attendanceSession.status === "SUBMITTED") {
      return conflict("Submitted attendance cannot be cancelled.");
    }

    attendanceSession.status = "CANCELLED";
    await attendanceSession.save();
    return apiOk({}, "Attendance session cancelled");
  } catch (err) {
    if (err instanceof Response) return err;
    return serverError();
  }
}

async function assertTeacherOwnsSession(
  session: { user: { role: string; teacherId?: string | null } },
  teacherId: Types.ObjectId
) {
  if (session.user.role === "TEACHER" && session.user.teacherId) {
    if (teacherId.toString() !== session.user.teacherId) {
      throw Response.json(
        { success: false, message: "You are not allowed to access this session." },
        { status: 403 }
      );
    }
  }
}
