"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AddStudentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<StudentFormValues>({ resolver: zodResolver(studentFormSchema), defaultValues: { status: "ACTIVE" } });

  const onSubmit = async (data: StudentFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); router.push("/students"); } else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add Student" breadcrumbs={[{ label: "Students", href: "/students" }, { label: "Add" }]} />
      <Card>
        <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID" error={errors.studentId}><Input {...register("studentId")} placeholder="23303101" /></Field>
            <Field label="Full Name" error={errors.name}><Input {...register("name")} placeholder="Rahim Uddin" /></Field>
            <Field label="Email" error={errors.email}><Input type="email" {...register("email")} placeholder="rahim@university.edu" /></Field>
            <Field label="Phone" error={errors.phone}><Input {...register("phone")} placeholder="+880 1XXX-XXXXXX" /></Field>
            <Field label="Department" error={errors.department}><Input {...register("department")} placeholder="CSE" /></Field>
            <Field label="Program" error={errors.program}><Input {...register("program")} placeholder="BSc in CSE" /></Field>
            <Field label="Semester" error={errors.semester}><Input type="number" {...register("semester")} placeholder="3" /></Field>
            <Field label="Section" error={errors.section}><Input {...register("section")} placeholder="A" /></Field>
          </CardContent>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="animate-spin" />}Add Student</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: { message?: string }; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
