"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentLink, setSentLink] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success && json.data?.resetUrl) {
        setSentLink(json.data.resetUrl);
        toast.success("Reset link generated below.");
      } else {
        toast.error(json.message || "Could not process the request.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter the email linked to your account and we&apos;ll generate a password reset link.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {sentLink && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-warning">
                <MailCheck className="h-4 w-4" aria-hidden /> Reset link ready
              </p>
              <p className="mt-1 text-muted-foreground">
                Email delivery is not configured in this demo, so use the link below:
              </p>
              <Link
                href={sentLink}
                className="mt-2 block break-all font-medium text-primary underline underline-offset-2"
              >
                {sentLink}
              </Link>
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
            Generate reset link
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <ArrowLeft aria-hidden />
              Back to sign in
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
