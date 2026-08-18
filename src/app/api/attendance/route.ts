import { NextRequest } from "next/server";
import { apiOk, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { ClassModel } from "@/models/Class";

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const courseId = searchParams.get("courseId");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = from;
      if (to) (filter.date as Record<string, unknown>).$lte = to;
    }
    if (courseId) filter.courseId = courseId;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;
    if (studentId) filter["students.studentId"] = studentId;

    // Teachers only see sessions for their own classes.
    if (session.user.role === "TEACHER" && session.user.teacherId) {
      const teacherClassIds = await ClassModel.find(
        { teacherId: session.user.teacherId },
        { _id: 1 }
      ).lean();
      filter.classId = {
        $in: teacherClassIds.map((c) => c._id),
        ...(classId ? { $eq: classId } : {}),
      };
    }

    const sessions = await AttendanceSessionModel.find(filter)
      .populate("courseId", "code name")
      .populate("classId", "name section room")
      .populate("teacherId", "name")
      .sort({ date: -1, startedAt: -1 })
      .limit(limit)
      .lean();

    return apiOk(sessions, "Attendance sessions retrieved");
  } catch {
    return serverError();
  }
}
