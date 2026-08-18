"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { monthKey } from "@/lib/utils";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface SessionRow { _id: string; date: string; students: { status: string }[]; }

export default function MonthlyReportPage() {
  const [month, setMonth] = useState(monthKey());
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?from=${month}-01&to=${month}-31&status=SUBMITTED`).then((r) => r.json()).then((j) => (j.success ? setSessions(j.data) : toast.error(j.message))).catch(() => toast.error("Failed.")).finally(() => setLoading(false));
  }, [month]);

  const byDay = new Map<string, { present: number; absent: number }>();
  sessions.forEach((s) => {
    const day = s.date.slice(8);
    const cur = byDay.get(day) ?? { present: 0, absent: 0 };
    cur.present += s.students.filter((st) => st.status === "PRESENT").length;
    cur.absent += s.students.filter((st) => st.status === "ABSENT").length;
    byDay.set(day, cur);
  });
  const chartData = Array.from({ length: 31 }, (_, i) => ({
    day: String(i + 1),
    present: byDay.get(String(i + 1))?.present ?? 0,
    absent: byDay.get(String(i + 1))?.absent ?? 0,
  })).filter((d) => d.present > 0 || d.absent > 0);

  const totalPresent = chartData.reduce((a, d) => a + d.present, 0);
  const totalAbsent = chartData.reduce((a, d) => a + d.absent, 0);

  const exportCSV = () => {
    const data = [["Day", "Present", "Absent"], ...chartData.map((d) => [d.day, String(d.present), String(d.absent)])];
    const csv = data.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `monthly-report-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly Attendance Report" breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Monthly" }]} actions={
        <>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>PDF</Button>
        </>
      } />

      <div className="flex flex-wrap items-center gap-4">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" aria-label="Report month" />
        <p className="text-sm text-muted-foreground">{totalPresent} present · {totalAbsent} absent · {totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0}% rate</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daily Attendance — {month}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : chartData.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No data for this month.</p> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="present" name="Present" fill="hsl(152 66% 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
