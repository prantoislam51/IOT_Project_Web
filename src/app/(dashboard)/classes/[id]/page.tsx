"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageSkeleton, UserStatusBadge } from "@/components/shared";
import { ClipboardCheck } from "lucide-react";

interface ClassDetail { _id: string; name: string; courseId: { code: string; name: string } | null; teacherId: { name: string; email: string } | null; studentIds: { _id: string; studentId: string; name: string; status: string }[]; room: string; schedule: string; startTime: string; endTime: string; status: string; deviceId: { deviceId: string; name: string } | null; }

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classes/${id}`).then((r) => r.json()).then((j) => (j.success ? setCls(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!cls) return <div className="py-20 text-center">Class not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={cls.name}
        description={`${cls.courseId?.code ?? "—"} · ${cls.courseId?.name ?? ""}`}
        breadcrumbs={[{ label: "Classes", href: "/classes" }, { label: cls.name }]}
        actions={
          <Button asChild size="sm"><Link href={`/attendance/take?classId=${cls._id}`}><ClipboardCheck className="h-4 w-4" /> Take Attendance</Link></Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Class Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Course" value={`${cls.courseId?.code ?? "—"} ${cls.courseId?.name ?? ""}`} />
            <Row label="Teacher" value={cls.teacherId?.name ?? "—"} />
            <Row label="Room" value={cls.room || "—"} />
            <Row label="Schedule" value={cls.schedule || "—"} />
            <Row label="Time" value={`${cls.startTime} – ${cls.endTime}`} />
            <Row label="Device" value={cls.deviceId ? `${cls.deviceId.name} (${cls.deviceId.deviceId})` : "—"} />
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><UserStatusBadge status={cls.status} /></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Enrolled Students ({cls.studentIds?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {cls.studentIds?.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No students enrolled in this class yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {cls.studentIds?.map((s) => (
                  <Link key={s._id} href={`/students/${s._id}`} className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="outline" className="font-mono text-xs">{s.studentId}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between gap-4"><span className="shrink-0 text-muted-foreground">{label}</span><span className="truncate font-medium">{value}</span></div>);
}
