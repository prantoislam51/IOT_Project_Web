"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageSkeleton, UserStatusBadge } from "@/components/shared";

interface Course { _id: string; code: string; name: string; department: string; credits: number; semester: number; section: string; teacherId: { name: string; email: string; department: string } | null; status: string; }

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}`).then((r) => r.json()).then((j) => (j.success ? setCourse(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!course) return <div className="py-20 text-center">Course not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={`${course.code} — ${course.name}`} description={`${course.department} · ${course.credits} credit(s)`} breadcrumbs={[{ label: "Courses", href: "/courses" }, { label: course.code }]} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Code" value={course.code} />
            <Row label="Name" value={course.name} />
            <Row label="Department" value={course.department} />
            <Row label="Credits" value={String(course.credits)} />
            <Row label="Semester" value={String(course.semester)} />
            <Row label="Section" value={course.section} />
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><UserStatusBadge status={course.status} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Teacher</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {course.teacherId ? (
              <>
                <Row label="Name" value={course.teacherId.name} />
                <Row label="Email" value={course.teacherId.email} />
                <Row label="Department" value={course.teacherId.department} />
              </>
            ) : (
              <p className="text-muted-foreground">No teacher assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>);
}
