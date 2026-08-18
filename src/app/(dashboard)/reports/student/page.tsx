"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, AttendanceBadge, StatCard } from "@/components/shared";
import { percent } from "@/lib/utils";
import { UserCheck, UserX, TrendingUp } from "lucide-react";

interface Student { _id: string; studentId: string; name: string; }
interface Record { _id: string; date: string; status: string; courseId?: { code: string } | null; classId?: { name: string } | null; studentIdSnapshot: string; studentNameSnapshot: string; }

export default function StudentReportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then((j) => (j.success ? setStudents(j.data) : null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetch(`/api/students/${studentId}`).then((r) => r.json()).then((j) => (j.success ? setRecords(j.data.attendance) : toast.error(j.message))).catch(() => toast.error("Failed.")).finally(() => setLoading(false));
  }, [studentId]);

  const present = records.filter((r) => r.status === "PRESENT").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Student Attendance Report" breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Student" }]} />

      <Select value={studentId} onValueChange={setStudentId}>
        <SelectTrigger className="w-full sm:max-w-md"><SelectValue placeholder="Select a student" /></SelectTrigger>
        <SelectContent>
          {students.map((s) => <SelectItem key={s._id} value={s._id}>{s.studentId} — {s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {studentId && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Present" value={present} icon={UserCheck} tone="success" />
            <StatCard title="Absent" value={records.length - present} icon={UserX} tone="destructive" />
            <StatCard title="Attendance Rate" value={`${percent(present, records.length)}%`} icon={TrendingUp} />
          </div>

          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No attendance records.</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <div className="divide-y">
                {records.map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-24 font-mono text-xs text-muted-foreground">{r.date}</span>
                      <Link href={`/attendance/${r._id}`} className="font-medium hover:underline">{r.studentNameSnapshot}</Link>
                    </div>
                    <AttendanceBadge status={r.status as "PRESENT" | "ABSENT"} />
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}
