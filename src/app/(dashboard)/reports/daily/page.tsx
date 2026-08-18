"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/shared";
import { todayKey, formatDateKey } from "@/lib/utils";
import { Download, Users, UserCheck, UserX } from "lucide-react";

interface SessionRow { _id: string; date: string; courseId: { code: string; name: string } | null; classId: { name: string } | null; teacherId: { name: string } | null; students: { status: string }[]; }

export default function DailyReportPage() {
  const [date, setDate] = useState(todayKey());
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?date=${date}&status=SUBMITTED`).then((r) => r.json()).then((j) => (j.success ? setSessions(j.data) : toast.error(j.message))).catch(() => toast.error("Failed.")).finally(() => setLoading(false));
  }, [date]);

  const rows = sessions.map((s) => {
    const present = s.students.filter((st) => st.status === "PRESENT").length;
    const absent = s.students.filter((st) => st.status === "ABSENT").length;
    return { code: s.courseId?.code ?? "—", className: s.classId?.name ?? "—", teacher: s.teacherId?.name ?? "—", total: s.students.length, present, absent, rate: s.students.length ? Math.round((present / s.students.length) * 100) : 0 };
  });

  const totalPresent = rows.reduce((a, r) => a + r.present, 0);
  const totalAbsent = rows.reduce((a, r) => a + r.absent, 0);

  const exportCSV = () => {
    const data = [["Date", "Course", "Class", "Teacher", "Total", "Present", "Absent", "Rate %"], ...rows.map((r) => [date, r.code, r.className, r.teacher, String(r.total), String(r.present), String(r.absent), String(r.rate)])];
    const csv = data.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `daily-report-${date}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Attendance Report" breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Daily" }]} actions={
        <>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>PDF</Button>
        </>
      } />

      <div className="flex flex-wrap gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" aria-label="Report date" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Sessions" value={rows.length} icon={Users} />
        <StatCard title="Total Present" value={totalPresent} icon={UserCheck} tone="success" />
        <StatCard title="Total Absent" value={totalAbsent} icon={UserX} tone="destructive" />
        <StatCard title="Rate" value={`${totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0}%`} icon={UserCheck} tone="primary" />
      </div>

      <p className="text-sm font-medium text-muted-foreground">{formatDateKey(date)}</p>

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : rows.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No submitted attendance on this date.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="p-4">Course</th><th className="p-4">Class</th><th className="p-4 hidden md:table-cell">Teacher</th><th className="p-4 text-center">Total</th><th className="p-4 text-center">Present</th><th className="p-4 text-center">Absent</th><th className="p-4 text-center">Rate</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-4 font-medium">{r.code}</td>
                    <td className="p-4">{r.className}</td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{r.teacher}</td>
                    <td className="p-4 text-center">{r.total}</td>
                    <td className="p-4 text-center text-success font-medium">{r.present}</td>
                    <td className="p-4 text-center text-destructive font-medium">{r.absent}</td>
                    <td className="p-4 text-center font-semibold">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
