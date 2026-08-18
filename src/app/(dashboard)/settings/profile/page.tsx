"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageSkeleton } from "@/components/shared";
import { Loader2 } from "lucide-react";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((j) => (j.success ? setProfile(j.data) : toast.error(j.message))).catch(() => toast.error("Failed to load profile."));
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "profile", name: profile.name, phone }) });
      const json = await res.json();
      if (json.success) toast.success(json.message); else toast.error(json.message);
    } catch { toast.error("Network error."); } finally { setSaving(false); }
  };

  if (!profile) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Profile Settings" breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
      <Card>
        <CardHeader><CardTitle className="text-base">Your Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Full Name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={profile.email} disabled /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" /></div>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
