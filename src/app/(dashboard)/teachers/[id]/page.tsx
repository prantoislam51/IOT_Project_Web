"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, UserStatusBadge, PageSkeleton } from "@/components/shared";
import { initials } from "@/lib/utils";

interface Teacher { _id: string; name: string; email: string; employeeId: string; department: string; phone: string; status: string; }

export default function TeacherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teachers/${id}`).then((r) => r.json()).then((j) => (j.success ? setTeacher(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!teacher) return <div className="py-20 text-center">Teacher not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={teacher.name} description={`Employee ID: ${teacher.employeeId}`} breadcrumbs={[{ label: "Teachers", href: "/teachers" }, { label: teacher.name }]} />
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20 text-2xl"><AvatarFallback>{initials(teacher.name)}</AvatarFallback></Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{teacher.name}</h2>
              <p className="text-sm text-muted-foreground">{teacher.email}</p>
              <div className="mt-2"><UserStatusBadge status={teacher.status} /></div>
            </div>
            <div className="w-full space-y-2 rounded-lg border p-4 text-sm">
              <Row label="Employee ID" value={teacher.employeeId} />
              <Row label="Department" value={teacher.department} />
              <Row label="Phone" value={teacher.phone || "—"} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>);
}
