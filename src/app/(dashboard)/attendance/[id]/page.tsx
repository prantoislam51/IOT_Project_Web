"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, AttendanceBadge, SessionStatusBadge, PageSkeleton } from "@/components/shared";
import { formatDateKey, formatDateTime, percent } from "@/lib/utils";
import { ArrowLeft, Download, Printer } from "lucide-react";

interface Session { _id: string; date: string; status: string; startedAt: string; submittedAt: string | null; students: { studentId: string; studentIdSnapshot: string; studentNameSnapshot: string; status: "PRESENT" | "ABSENT" | null }[]; classId: { name: string; room: string } | null; courseId: { code: string; name: string } | null; teacherId: { name: string } | null; }

export default function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attendance/${id}`).then((r) => r.json()).then((j) => (j.success ? setSession(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!session) return <div className="py-20 text-center">Session not found.</div>;

  const present = session.students.filter((s) => s.status === "PRESENT").length;
  const absent = session.students.filter((s) => s.status === "ABSENT").length;
  const total = session.students.length;

  const exportCSV = () => {
    const rows = [["Student ID", "Name", "Status"], ...session.students.map((s) => [s.studentIdSnapshot, s.studentNameSnapshot, s.status ?? "UNMARKED"])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance-${session.courseId?.code}-${session.date}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${session.courseId?.code ?? ""} Attendance`}
        description={`${session.classId?.name ?? ""} · ${formatDateKey(session.date)}`}
        breadcrumbs={[{ label: "Attendance", href: "/attendance/history" }, { label: session.date }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Present</p><p className="text-2xl font-bold text-success">{present}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Absent</p><p className="text-2xl font-bold text-destructive">{absent}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rate</p><p className="text-2xl font-bold text-primary">{percent(present, total)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Student Records</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {session.submittedAt && <span>Submitted {formatDateTime(session.submittedAt)}</span>}
            <SessionStatusBadge status={session.status} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {session.students.map((s) => (
              <div key={s.studentId} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="w-24 font-mono text-xs text-muted-foreground">{s.studentIdSnapshot}</span>
                  <span className="font-medium">{s.studentNameSnapshot}</span>
                </div>
                <AttendanceBadge status={s.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
