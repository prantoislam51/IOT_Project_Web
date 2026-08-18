"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageSkeleton } from "@/components/shared";
import { Loader2 } from "lucide-react";

interface Settings { institutionName: string; timezone: string; studentDisplaySeconds: number; lcdTransitionMs: number; successDurationSeconds: number; readyDurationSeconds: number; devicePollingMs: number; defaultAttendanceStatus: string; }

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((j) => (j.success ? setSettings(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load settings."));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const json = await res.json();
      if (json.success) toast.success(json.message); else toast.error(json.message);
    } catch { toast.error("Network error."); } finally { setSaving(false); }
  };

  if (!settings) return <PageSkeleton />;

  const set = (key: keyof Settings, value: string | number) => setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" breadcrumbs={[{ label: "Settings" }, { label: "System" }]} actions={
        <Button size="sm" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save Settings</Button>
      } />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Institution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>Institution Name</Label><Input value={settings.institutionName} onChange={(e) => set("institutionName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Timezone</Label><Input value={settings.timezone} onChange={(e) => set("timezone", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">LCD Display Timing</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Student Display (seconds)</Label><Input type="number" value={settings.studentDisplaySeconds} onChange={(e) => set("studentDisplaySeconds", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Transition (ms)</Label><Input type="number" value={settings.lcdTransitionMs} onChange={(e) => set("lcdTransitionMs", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Success Message (seconds)</Label><Input type="number" value={settings.successDurationSeconds} onChange={(e) => set("successDurationSeconds", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Ready Message (seconds)</Label><Input type="number" value={settings.readyDurationSeconds} onChange={(e) => set("readyDurationSeconds", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Device Polling (ms)</Label><Input type="number" value={settings.devicePollingMs} onChange={(e) => set("devicePollingMs", Number(e.target.value))} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
