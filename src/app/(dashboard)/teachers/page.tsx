"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, DataTable, UserStatusBadge, PageSkeleton } from "@/components/shared";
import { initials } from "@/lib/utils";

interface Teacher { _id: string; name: string; email: string; employeeId: string; department: string; phone: string; status: string; }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/teachers").then((r) => r.json()).then((j) => (j.success ? setTeachers(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load teachers.")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" description={`${teachers.length} teacher(s)`} breadcrumbs={[{ label: "Teachers" }]} actions={
        <Button asChild size="sm"><Link href="/teachers/add"><Plus className="h-4 w-4" /> Add Teacher</Link></Button>
      } />
      <DataTable
        data={teachers}
        searchPlaceholder="Search by name, email, or employee ID..."
        emptyTitle="No teachers found"
        emptyAction={{ label: "Add Teacher", href: "/teachers/add" }}
        columns={[
          { key: "name", header: "Name", render: (t) => (
            <Link href={`/teachers/${t._id}`} className="flex items-center gap-2.5 font-medium hover:underline">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials(t.name)}</AvatarFallback></Avatar>
              <div className="min-w-0"><span className="block truncate">{t.name}</span><span className="block truncate text-xs text-muted-foreground">{t.email}</span></div>
            </Link>
          )},
          { key: "employeeId", header: "Employee ID", render: (t) => <span className="font-mono text-xs">{t.employeeId}</span>, hideOnMobile: true },
          { key: "department", header: "Department", render: (t) => t.department, hideOnMobile: true },
          { key: "status", header: "Status", render: (t) => <UserStatusBadge status={t.status} /> },
        ]}
      />
    </div>
  );
}
