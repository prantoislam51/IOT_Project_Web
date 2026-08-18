"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, DataTable, UserStatusBadge, PageSkeleton } from "@/components/shared";
import { initials } from "@/lib/utils";

interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  program: string;
  semester: number;
  section: string;
  status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/students?limit=500")
      .then((r) => r.json())
      .then((j) => (j.success ? setStudents(j.data) : toast.error(j.message)))
      .catch(() => toast.error("Failed to load students."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${students.length} student(s) registered`}
        breadcrumbs={[{ label: "Students" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/students/add"><Plus className="h-4 w-4" /> Add Student</Link>
          </Button>
        }
      />

      <DataTable
        data={students}
        searchPlaceholder="Search by name, ID, or email..."
        emptyTitle="No students found"
        emptyDescription="Add your first student to get started."
        emptyAction={{ label: "Add Student", href: "/students/add" }}
        columns={[
          {
            key: "studentId",
            header: "ID",
            render: (s) => (
              <Link href={`/students/${s._id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                {s.studentId}
              </Link>
            ),
            hideOnMobile: true,
          },
          {
            key: "name",
            header: "Name",
            render: (s) => (
              <Link href={`/students/${s._id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials(s.name)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <span className="block truncate">{s.name}</span>
                  {s.email && <span className="block truncate text-xs text-muted-foreground">{s.email}</span>}
                </div>
              </Link>
            ),
          },
          { key: "department", header: "Department", render: (s) => <span>{s.department}</span>, hideOnMobile: true },
          {
            key: "semester",
            header: "Sem",
            render: (s) => <Badge variant="secondary">Sem {s.semester} · {s.section}</Badge>,
            hideOnMobile: true,
          },
          { key: "status", header: "Status", render: (s) => <UserStatusBadge status={s.status} /> },
        ]}
      />
    </div>
  );
}
