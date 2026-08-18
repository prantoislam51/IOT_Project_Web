import { NextRequest } from "next/server";
import { apiOk, badRequest, serverError } from "@/lib/api";
import { authenticateDevice } from "@/lib/device-auth";
import { DeviceModel } from "@/models/Device";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { CourseModel } from "@/models/Course";

type Params = { params: Promise<{ id: string }> };

/**
 * ESP32 retrieves the attendance data it should display.
 * Without sessionId: returns the active (unsubmitted) session for the
 * class assigned to this device. With sessionId: returns that session
 * (used to show the final summary after submission).
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { device, error: authError } = await authenticateDevice(request, id);
  if (authError) return authError;

  try {
    const doc = await DeviceModel.findById(device._id).lean();
    const sessionIdParam = request.nextUrl.searchParams.get("sessionId");

    let session;
    if (sessionIdParam) {
      session = await AttendanceSessionModel.findById(sessionId).lean();
    } else {
      if (!doc?.classId) {
        return apiOk({ session: null }, "No class assigned to this device.");
      }
      session = await AttendanceSessionModel.findOne({
        classId: doc.classId,
        status: { $in: ["ACTIVE", "DRAFT"] },
      })
        .sort({ startedAt: -1 })
        .lean();
    }

    if (!session) {
      return apiOk({ session: null }, "No active attendance session.");
    }

    const course = await CourseModel.findById(session.courseId, "code name").lean();

    const present = session.students.filter((s) => s.status === "PRESENT").length;
    const absent = session.students.filter((s) => s.status === "ABSENT").length;
    const unmarked = session.students.filter((s) => !s.status).length;

    return apiOk(
      {
        session: {
          id: session._id,
          status: session.status,
          date: session.date,
          courseCode: course?.code ?? "",
          courseName: course?.name ?? "",
          present,
          absent,
          unmarked,
          total: session.students.length,
          students: session.students.map((s) => ({
            studentId: s.studentIdSnapshot,
            name: s.studentNameSnapshot,
            status: s.status,
          })),
        },
      },
      "Attendance data for display"
    );
  } catch {
    return serverError();
  }
}
