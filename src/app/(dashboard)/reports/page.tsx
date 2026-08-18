"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { CalendarDays, CalendarRange, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const reports = [
    { title: "Daily Attendance", description: "Summary of attendance for a specific date across all classes.", href: "/reports/daily", icon: CalendarDays },
    { title: "Monthly Attendance", description: "Day-by-day attendance trends for a selected month.", href: "/reports/monthly", icon: CalendarRange },
    { title: "Student Report", description: "Individual attendance history and percentage per student.", href: "/reports/student", icon: UserRound },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analyze attendance data and export results" breadcrumbs={[{ label: "Reports" }]} />
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.href}>
            <CardHeader>
              <r.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Button asChild size="sm" variant="outline"><Link href={r.href}>Open Report</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
