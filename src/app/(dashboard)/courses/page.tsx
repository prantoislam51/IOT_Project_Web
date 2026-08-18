"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, DataTable, PageSkeleton } from "@/components/shared";

interface Course { _id: string; code: string; name: string; department: string; credits: number; semester: number; section: string; teacherId: { _id: string; name: string } | null; status: string; }

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses").then((r) => r.json()).then((j) => (j.success ? setCourses(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load courses.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description={`${courses.length} course(s)`} breadcrumbs={[{ label: "Courses" }]} actions={
        <Button asChild size="sm"><Link href="/courses/add"><Plus className="h-4 w-4" /> Add Course</Link></Button>
      } />
      <DataTable
        data={courses}
        searchPlaceholder="Search by code or name..."
        emptyTitle="No courses found"
        emptyAction={{ label: "Add Course", href: "/courses/add" }}
        columns={[
          { key: "code", header: "Code", render: (c) => <Link href={`/courses/${c._id}`} className="font-mono text-sm font-semibold text-primary hover:underline">{c.code}</Link> },
          { key: "name", header: "Course Name", render: (c) => (
            <Link href={`/courses/${c._id}`} className="font-medium hover:underline">
              <span className="block">{c.name}</span>
              <span className="block text-xs text-muted-foreground">{c.department} · {c.credits} credit(s)</span>
            </Link>
          )},
          { key: "semester", header: "Sem / Sec", render: (c) => <Badge variant="secondary">{c.semester} / {c.section}</Badge>, hideOnMobile: true },
          { key: "teacher", header: "Teacher", render: (c) => c.teacherId?.name ?? "—", hideOnMobile: true },
        ]}
      />
    </div>
  );
}
