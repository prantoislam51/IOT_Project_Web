import { apiOk, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { StudentModel } from "@/models/Student";
import { ClassModel } from "@/models/Class";
import { DeviceModel } from "@/models/Device";
import { AttendanceSessionModel } from "@/models/AttendanceSession";
import { AttendanceRecordModel } from "@/models/AttendanceRecord";
import { todayKey, lastNDaysKeys, monthDayKeys, monthKey } from "@/lib/utils";
import { isDeviceOnline } from "@/lib/device-auth";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const today = todayKey();
    const isAdmin = session.user.role === "ADMIN";

    // Total students
    const totalStudents = await StudentModel.countDocuments({ status: "ACTIVE" });

    // Build class filter for teachers
    const classFilter: Record<string, unknown> = {};
    if (!isAdmin && session.user.teacherId) {
      classFilter.teacherId = session.user.teacherId;
    }

    const activeClasses = await ClassModel.countDocuments({ ...classFilter, status: "ACTIVE" });

    // Today's attendance
    const todaySessions = await AttendanceSessionModel.find({
      date: today,
      status: "SUBMITTED",
      ...(!isAdmin && session.user.teacherId
        ? { teacherId: session.user.teacherId }
        : {}),
    }).lean();

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayTotal = 0;
    for (const s of todaySessions) {
      todayPresent += s.students.filter((st) => st.status === "PRESENT").length;
      todayAbsent += s.students.filter((st) => st.status === "ABSENT").length;
      todayTotal += s.students.length;
    }

    const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;

    // Connected devices (admin only)
    let connectedDevices = 0;
    if (isAdmin) {
      const devices = await DeviceModel.find({ status: "ACTIVE" }, { lastSeen: 1 }).lean();
      connectedDevices = devices.filter((d) => isDeviceOnline(d.lastSeen)).length;
    }

    // Weekly chart (last 7 days)
    const weekKeys = lastNDaysKeys(7);
    const weeklyData = await Promise.all(
      weekKeys.map(async (date) => {
        const sessions = await AttendanceSessionModel.find({
          date,
          status: "SUBMITTED",
          ...(!isAdmin && session.user.teacherId
            ? { teacherId: session.user.teacherId }
            : {}),
        }).lean();
        let p = 0, a = 0;
        for (const s of sessions) {
          p += s.students.filter((st) => st.status === "PRESENT").length;
          a += s.students.filter((st) => st.status === "ABSENT").length;
        }
        return { date, present: p, absent: a };
      })
    );

    // Monthly chart (this month)
    const mk = monthKey();
    const monthKeys = monthDayKeys(mk);
    const monthSessions = await AttendanceSessionModel.find({
      date: { $in: monthKeys },
      status: "SUBMITTED",
      ...(!isAdmin && session.user.teacherId
        ? { teacherId: session.user.teacherId }
        : {}),
    }).lean();

    const monthlyMap = new Map<string, { present: number; absent: number }>();
    for (const s of monthSessions) {
      const d = s.date;
      const cur = monthlyMap.get(d) ?? { present: 0, absent: 0 };
      cur.present += s.students.filter((st) => st.status === "PRESENT").length;
      cur.absent += s.students.filter((st) => st.status === "ABSENT").length;
      monthlyMap.set(d, cur);
    }

    const monthlyData = monthKeys.map((date) => ({
      date: date.slice(8),
      ...monthlyMap.get(date),
      present: monthlyMap.get(date)?.present ?? 0,
      absent: monthlyMap.get(date)?.absent ?? 0,
    }));

    return apiOk({
      totalStudents,
      todayPresent,
      todayAbsent,
      todayTotal,
      attendanceRate,
      activeClasses,
      connectedDevices,
      weeklyData,
      monthlyData,
    });
  } catch {
    return serverError();
  }
}
