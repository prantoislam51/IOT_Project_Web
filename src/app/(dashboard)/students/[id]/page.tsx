"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, AttendanceBadge, PageSkeleton, UserStatusBadge } from "@/components/shared";
import { initials, percent } from "@/lib/utils";

interface StudentData { student: Record<string, unknown>; attendance: Record<string, unknown>[]; }

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((j) => (j.success ? setData(j.data) : toast.error(j.message)))
      .catch(() => toast.error("Failed to load student."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;
  const s = data?.student as Record<string, string> | null;
  if (!s) return <div className="text-center py-20">Student not found.</div>;

  const att = data?.attendance ?? [];
  const present = att.filter((a) => a.status === "PRESENT").length;
  const total = att.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={`Student ID: ${s.studentId}`}
        breadcrumbs={[{ label: "Students", href: "/students" }, { label: s.studentId }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button asChild size="sm"><Link href={`/students/${id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20 text-2xl"><AvatarFallback>{initials(s.name)}</AvatarFallback></Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <p className="text-sm text-muted-foreground">{s.email || "No email"}</p>
              <div className="mt-2"><UserStatusBadge status={s.status} /></div>
            </div>
            <div className="w-full space-y-2 rounded-lg border p-4 text-sm">
              <Row label="Department" value={s.department} />
              <Row label="Program" value={s.program} />
              <Row label="Semester" value={s.semester} />
              <Row label="Section" value={s.section} />
              <Row label="Phone" value={s.phone || "—"} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-success/10 p-3 text-center">
                <p className="text-2xl font-bold text-success">{present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{total - present}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{percent(present, total)}%</p>
                <p className="text-xs text-muted-foreground">Rate</p>
              </div>
            </div>
            {att.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {att.slice(0, 30).map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <span className="font-medium">{(a as Record<string, string>).date}</span>
                    </div>
                    <AttendanceBadge status={(a as Record<string, string>).status as "PRESENT" | "ABSENT"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
