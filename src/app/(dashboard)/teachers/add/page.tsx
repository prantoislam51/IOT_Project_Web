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
import { teacherFormSchema, type TeacherFormValues } from "@/lib/validations";

export default function AddTeacherPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<TeacherFormValues>({ resolver: zodResolver(teacherFormSchema), defaultValues: { status: "ACTIVE" } });

  const onSubmit = async (data: TeacherFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); router.push("/teachers"); } else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add Teacher" breadcrumbs={[{ label: "Teachers", href: "/teachers" }, { label: "Add" }]} />
      <Card>
        <CardHeader><CardTitle>Teacher Information</CardTitle></CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <F label="Full Name" error={errors.name}><Input {...register("name")} placeholder="Dr. Ahmed" /></F>
            <F label="Email" error={errors.email}><Input type="email" {...register("email")} placeholder="ahmed@university.edu" /></F>
            <F label="Employee ID" error={errors.employeeId}><Input {...register("employeeId")} placeholder="EMP-001" /></F>
            <F label="Phone" error={errors.phone}><Input {...register("phone")} placeholder="+880 1XXX-XXXXXX" /></F>
            <F label="Department" error={errors.department}><Input {...register("department")} placeholder="CSE" /></F>
          </CardContent>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="animate-spin" />}Add Teacher</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: { message?: string }; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error.message}</p>}</div>);
}
