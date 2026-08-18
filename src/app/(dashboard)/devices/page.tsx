"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, PageSkeleton } from "@/components/shared";
import { timeAgo } from "@/lib/utils";
import { MonitorSmartphone, Wifi, WifiOff } from "lucide-react";

interface Device { _id: string; deviceId: string; name: string; location: string; status: string; online: boolean; ipAddress: string; firmwareVersion: string; lastSeen: string | null; classId: { _id: string; name: string } | null; }
interface ClassOption { _id: string; name: string; }

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ deviceId: "", name: "", location: "", classId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const load = () => {
    setLoading(true);
    fetch("/api/devices").then((r) => r.json()).then((j) => (j.success ? setDevices(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load devices.")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); fetch("/api/classes").then((r) => r.json()).then((j) => (j.success ? setClasses(j.data) : null)).catch(() => {}); }, []);

  const addDevice = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "ACTIVE" }) });
      const json = await res.json();
      if (json.success) { toast.success("Device registered."); setNewApiKey(json.data.apiKey); setAddOpen(false); setForm({ deviceId: "", name: "", location: "", classId: "" }); load(); }
      else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="IoT Devices" description={`${devices.length} device(s) · ESP32-S3 + 16×2 LCD`} breadcrumbs={[{ label: "Devices" }]} actions={
        <>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Register Device</Button>
        </>
      } />

      {loading ? <PageSkeleton /> : devices.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <MonitorSmartphone className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No devices registered yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => (
            <Link key={d._id} href={`/devices/${d.deviceId}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{d.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">{d.deviceId}</p>
                    </div>
                    {d.online ? (
                      <Badge variant="success" className="gap-1.5"><Wifi className="h-3 w-3" /> Online</Badge>
                    ) : (
                      <Badge variant="muted" className="gap-1.5"><WifiOff className="h-3 w-3" /> Offline</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Location: {d.location || "—"}</p>
                    <p>Class: {d.classId?.name ?? "Unassigned"}</p>
                    <p>Last seen: {timeAgo(d.lastSeen)}</p>
                    <p>Firmware: {d.firmwareVersion || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setNewApiKey(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register ESP32 Device</DialogTitle><DialogDescription>Add a new ESP32-S3 display device.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Device ID</Label><Input value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value.toUpperCase() })} placeholder="DEVICE-001" /></div>
            <div className="space-y-1.5"><Label>Device Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Room 302 Display" /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 302, Academic Building" /></div>
            <div className="space-y-1.5"><Label>Assign to Class (optional)</Label>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={addDevice} disabled={submitting || !form.deviceId || !form.name}>Register</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newApiKey} onOpenChange={(o) => !o && setNewApiKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Device API Key</DialogTitle><DialogDescription>Copy this key into your ESP32 firmware config (include/config.h). It is shown only once.</DialogDescription></DialogHeader>
          <code className="break-all rounded-lg border bg-muted p-4 font-mono text-sm">{newApiKey}</code>
        </DialogContent>
      </Dialog>
    </div>
  );
}
