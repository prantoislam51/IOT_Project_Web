"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { studentFormSchema, type StudentFormValues } from "@/lib/validations";

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormValues>({ resolver: zodResolver(studentFormSchema) });

  useEffect(() => {
    fetch(`/api/students/${id}`).then((r) => r.json()).then((j) => { if (j.success) { const s = j.data.student; reset({ studentId: s.studentId, name: s.name, email: s.email || "", phone: s.phone || "", department: s.department, program: s.program, semester: s.semester, section: s.section, profileImage: s.profileImage || "", status: s.status }); } else { toast.error(j.message); router.push("/students"); } }).catch(() => toast.error("Failed to load student."));
  }, [id, reset, router]);

  const onSubmit = async (data: StudentFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); router.push(`/students/${id}`); } else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit Student" breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Edit" }]} />
      <Card>
        <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <F label="Student ID" error={errors.studentId}><Input {...register("studentId")} /></F>
            <F label="Full Name" error={errors.name}><Input {...register("name")} /></F>
            <F label="Email" error={errors.email}><Input type="email" {...register("email")} /></F>
            <F label="Phone" error={errors.phone}><Input {...register("phone")} /></F>
            <F label="Department" error={errors.department}><Input {...register("department")} /></F>
            <F label="Program" error={errors.program}><Input {...register("program")} /></F>
            <F label="Semester" error={errors.semester}><Input type="number" {...register("semester")} /></F>
            <F label="Section" error={errors.section}><Input {...register("section")} /></F>
          </CardContent>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="animate-spin" />}Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: { message?: string }; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error.message}</p>}</div>);
}
