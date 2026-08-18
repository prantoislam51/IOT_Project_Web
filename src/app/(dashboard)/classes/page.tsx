"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, PageSkeleton, UserStatusBadge } from "@/components/shared";
import { School, Users, Clock, MapPin } from "lucide-react";

interface ClassItem { _id: string; name: string; courseId: { code: string; name: string } | null; teacherId: { name: string } | null; studentIds: unknown[]; room: string; schedule: string; startTime: string; endTime: string; status: string; }

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then((j) => (j.success ? setClasses(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load classes.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" description={`${classes.length} class(es)`} breadcrumbs={[{ label: "Classes" }]} />
      {classes.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No classes found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <Link key={c._id} href={`/classes/${c._id}`} className="group">
              <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="secondary" className="mb-1.5 font-mono">{c.courseId?.code ?? "—"}</Badge>
                      <h3 className="font-semibold leading-tight">{c.name}</h3>
                    </div>
                    <UserStatusBadge status={c.status} />
                  </div>
                  <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><School className="h-4 w-4 shrink-0" />{c.courseId?.name ?? "No course"}</p>
                    <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{c.studentIds?.length ?? 0} students · {c.teacherId?.name ?? "No teacher"}</p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" />{c.startTime} – {c.endTime} {c.schedule && `· ${c.schedule}`}</p>
                    {c.room && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />Room {c.room}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">View Class</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
