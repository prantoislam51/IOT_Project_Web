"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  School,
  MonitorSmartphone,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, ChartSkeleton } from "@/components/shared";

interface DashboardStats {
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  todayTotal: number;
  attendanceRate: number;
  activeClasses: number;
  connectedDevices: number;
  weeklyData: { date: string; present: number; absent: number }[];
  monthlyData: { date: string; present: number; absent: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((j) => (j.success ? setStats(j.data) : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here is your attendance overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Students" value={stats?.totalStudents ?? "—"} icon={Users} tone="primary" />
        <StatCard title="Present Today" value={stats?.todayPresent ?? "—"} icon={UserCheck} tone="success" />
        <StatCard title="Absent Today" value={stats?.todayAbsent ?? "—"} icon={UserX} tone="destructive" />
        <StatCard
          title="Attendance Rate"
          value={stats ? `${stats.attendanceRate}%` : "—"}
          icon={TrendingUp}
          tone={stats && stats.attendanceRate >= 75 ? "success" : "warning"}
          description={stats ? `of ${stats.todayTotal} records today` : undefined}
        />
        <StatCard title="Active Classes" value={stats?.activeClasses ?? "—"} icon={School} tone="info" />
        <StatCard title="Connected Devices" value={stats?.connectedDevices ?? "—"} icon={MonitorSmartphone} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats?.weeklyData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="hsl(152 66% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats?.monthlyData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="present" name="Present" stroke="hsl(152 66% 36%)" fill="hsl(152 66% 36% / 0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke="hsl(0 72% 51%)" fill="hsl(0 72% 51% / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
