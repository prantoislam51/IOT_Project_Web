"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared";
import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (newPassword.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "password", currentPassword, newPassword, confirmPassword }) });
      const json = await res.json();
      if (json.success) { toast.success("Password changed. Please sign in again."); signOut({ callbackUrl: "/login" }); }
      else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Security Settings" breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Security" }]} />
      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          <Button onClick={save} disabled={saving || !currentPassword}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Change Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
