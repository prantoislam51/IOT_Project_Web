"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageSkeleton, SessionStatusBadge } from "@/components/shared";
import { formatDateKey } from "@/lib/utils";

interface SessionRow { _id: string; date: string; status: string; courseId: { code: string; name: string } | null; classId: { name: string } | null; teacherId: { name: string } | null; students: { status: string }[]; }

export default function AttendanceHistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status !== "ALL") params.set("status", status);
    fetch(`/api/attendance?${params}`).then((r) => r.json()).then((j) => (j.success ? setSessions(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, [from, to, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance History" description="Browse all submitted attendance sessions" breadcrumbs={[{ label: "Attendance", href: "/attendance" }, { label: "History" }]} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-40" aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-40" aria-label="To date" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <PageSkeleton /> : sessions.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No attendance sessions found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const present = s.students.filter((st) => st.status === "PRESENT").length;
            const absent = s.students.filter((st) => st.status === "ABSENT").length;
            const rate = s.students.length > 0 ? Math.round((present / s.students.length) * 100) : 0;
            return (
              <Link key={s._id} href={`/attendance/${s._id}`} className="block">
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{s.courseId?.code} — {s.classId?.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDateKey(s.date)} · {s.teacherId?.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-success font-medium">{present}P</span>
                      <span className="text-destructive font-medium">{absent}A</span>
                      <span className="font-medium">{rate}%</span>
                      <SessionStatusBadge status={s.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
