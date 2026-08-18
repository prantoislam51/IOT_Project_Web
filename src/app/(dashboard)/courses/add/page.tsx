"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared";
import { courseFormSchema, type CourseFormValues } from "@/lib/validations";

interface Teacher { _id: string; name: string; department: string; }

export default function AddCoursePage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CourseFormValues>({ resolver: zodResolver(courseFormSchema), defaultValues: { status: "ACTIVE" } });

  useEffect(() => {
    fetch("/api/teachers").then((r) => r.json()).then((j) => (j.success ? setTeachers(j.data) : null)).catch(() => {});
  }, []);

  const teacherId = watch("teacherId");

  const onSubmit = async (data: CourseFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); router.push("/courses"); } else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add Course" breadcrumbs={[{ label: "Courses", href: "/courses" }, { label: "Add" }]} />
      <Card>
        <CardHeader><CardTitle>Course Information</CardTitle></CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <F label="Course Code" error={errors.code}><Input {...register("code")} placeholder="CSC 215" /></F>
            <F label="Course Name" error={errors.name}><Input {...register("name")} placeholder="Data Structures" /></F>
            <F label="Department" error={errors.department}><Input {...register("department")} placeholder="CSE" /></F>
            <F label="Credits" error={errors.credits}><Input type="number" step="0.5" {...register("credits")} placeholder="3" /></F>
            <F label="Semester" error={errors.semester}><Input type="number" {...register("semester")} placeholder="3" /></F>
            <F label="Section" error={errors.section}><Input {...register("section")} placeholder="B" /></F>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Teacher</Label>
              <Select value={teacherId ?? ""} onValueChange={(v) => setValue("teacherId", v)}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t._id} value={t._id}>{t.name} — {t.department}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
            </div>
          </CardContent>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="animate-spin" />}Add Course</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: { message?: string }; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error.message}</p>}</div>);
}
