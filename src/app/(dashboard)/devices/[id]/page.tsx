"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, PageSkeleton } from "@/components/shared";
import { timeAgo, formatDateTime } from "@/lib/utils";
import { ArrowLeft, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface Device { _id: string; deviceId: string; name: string; location: string; status: string; online: boolean; ipAddress: string; firmwareVersion: string; lastSeen: string | null; currentState: string; classId: { _id: string; name: string; room: string } | null; }

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/devices/${id}`).then((r) => r.json()).then((j) => (j.success ? setDevice(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <PageSkeleton />;
  if (!device) return <div className="py-20 text-center">Device not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={device.name}
        description={`Device ID: ${device.deviceId}`}
        breadcrumbs={[{ label: "Devices", href: "/devices" }, { label: device.deviceId }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Status</CardTitle>
            {device.online ? <Badge variant="success" className="gap-1.5"><Wifi className="h-3 w-3" /> Online</Badge> : <Badge variant="muted" className="gap-1.5"><WifiOff className="h-3 w-3" /> Offline</Badge>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Last Heartbeat" value={device.lastSeen ? `${formatDateTime(device.lastSeen)} (${timeAgo(device.lastSeen)})` : "never"} />
            <Row label="IP Address" value={device.ipAddress || "—"} />
            <Row label="Firmware" value={device.firmwareVersion || "—"} />
            <Row label="Current State" value={device.currentState || "READY"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Location" value={device.location || "—"} />
            <Row label="Assigned Class" value={device.classId?.name ?? "Unassigned"} />
            <Row label="Room" value={device.classId?.room || "—"} />
            <Row label="Device Status" value={device.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between gap-4"><span className="shrink-0 text-muted-foreground">{label}</span><span className="truncate font-medium">{value}</span></div>);
}
