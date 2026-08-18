"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Search, CheckCheck, RotateCcw, Send, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, PageSkeleton, AttendanceBadge } from "@/components/shared";
import { cn, formatDateKey } from "@/lib/utils";

interface ClassOption { _id: string; name: string; courseId: { code: string; name: string } | null; studentIds: unknown[]; deviceId?: { name: string } | null; }
interface SessionStudent { studentId: string; studentIdSnapshot: string; studentNameSnapshot: string; status: "PRESENT" | "ABSENT" | null; }
interface Session { _id: string; date: string; status: string; students: SessionStudent[]; classId: { name: string; room: string } | null; courseId: { code: string; name: string } | null; }

function TakeAttendance() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselected = searchParams.get("classId");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState(preselected ?? "");
  const [session, setSession] = useState<Session | null>(null);
  const [statuses, setStatuses] = useState<Record<string, "PRESENT" | "ABSENT">>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then((j) => {
      if (j.success) { setClasses(j.data); if (!preselected && j.data.length > 0) setClassId(j.data[0]._id); }
      else toast.error(j.message);
    }).catch(() => toast.error("Failed to load classes."));
  }, [preselected]);

  const startSession = async () => {
    if (!classId) return;
    setStarting(true);
    try {
      const res = await fetch("/api/attendance/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId }) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); setSession(json.data); } else { toast.error(json.message); }
    } catch { toast.error("Network error."); } finally { setStarting(false); }
  };

  // Load existing session when class changes
  useEffect(() => {
    if (!classId) return;
    fetch(`/api/attendance?classId=${classId}&limit=1`).then((r) => r.json()).then((j) => {
      if (j.success && j.data.length > 0 && (j.data[0].status === "ACTIVE" || j.data[0].status === "DRAFT")) {
        fetch(`/api/attendance/${j.data[0]._id}`).then((r2) => r2.json()).then((j2) => {
          if (j2.success) { setSession(j2.data); toast.info("Resumed the active session for this class."); }
        });
      } else { setSession(null); }
    }).catch(() => {});
  }, [classId]);

  // Initialize statuses from session
  useEffect(() => {
    if (!session) return;
    const initial: Record<string, "PRESENT" | "ABSENT"> = {};
    session.students.forEach((s) => { if (s.status) initial[s.studentId] = s.status; });
    setStatuses(initial);
  }, [session]);

  const students = session?.students ?? [];
  const marked = students.filter((s) => statuses[s.studentId]).length;
  const present = students.filter((s) => statuses[s.studentId] === "PRESENT").length;
  const absent = students.filter((s) => statuses[s.studentId] === "ABSENT").length;

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filter === "PRESENT" && statuses[s.studentId] !== "PRESENT") return false;
      if (filter === "ABSENT" && statuses[s.studentId] !== "ABSENT") return false;
      if (filter === "UNMARKED" && statuses[s.studentId]) return false;
      if (search && !s.studentNameSnapshot.toLowerCase().includes(search.toLowerCase()) && !s.studentIdSnapshot.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, statuses, search, filter]);

  const setStatus = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: "PRESENT" | "ABSENT") => {
    const next: Record<string, "PRESENT" | "ABSENT"> = {};
    students.forEach((s) => { next[s.studentId] = status; });
    setStatuses(next);
  };

  const reset = () => { setStatuses({}); toast.info("Attendance reset."); };

  const autosave = async () => {
    if (!session) return;
    setSaving(true);
    const payload = { statuses: students.filter((s) => statuses[s.studentId]).map((s) => ({ studentId: s.studentId, status: statuses[s.studentId] })) };
    try {
      const res = await fetch(`/api/attendance/${session._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) toast.success("Progress saved."); else toast.error(json.message);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const submit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const payload = { statuses: students.map((s) => ({ studentId: s.studentId, status: statuses[s.studentId] ?? "ABSENT" })) };
      const res = await fetch(`/api/attendance/${session._id}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) { toast.success(json.message); router.push(`/attendance/${session._id}`); }
      else { toast.error(json.message); setConfirmOpen(false); }
    } catch { toast.error("Network error."); } finally { setSubmitting(false); setConfirmOpen(false); }
  };

  const selectedClass = classes.find((c) => c._id === classId);

  return (
    <div className="space-y-6">
      <PageHeader title="Take Attendance" breadcrumbs={[{ label: "Attendance", href: "/attendance" }, { label: "Take" }]} />

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.courseId?.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startSession} disabled={!classId || starting || !!session}>
            {starting ? <Loader2 className="animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            {session ? "Session Active" : "Start Session"}
          </Button>
        </CardContent>
      </Card>

      {!session ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            {selectedClass ? "Click Start Session to begin taking attendance." : "Select a class to begin."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="text-lg font-bold">{session.courseId?.code} Attendance</h2>
                <p className="text-sm text-muted-foreground">{session.classId?.name} · {formatDateKey(session.date)}</p>
              </div>
              <div className="flex gap-4 text-center">
                <div><p className="text-xl font-bold text-success">{present}</p><p className="text-xs text-muted-foreground">Present</p></div>
                <div><p className="text-xl font-bold text-destructive">{absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                <div><p className="text-xl font-bold">{marked}/{students.length}</p><p className="text-xs text-muted-foreground">Marked</p></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="UNMARKED">Unmarked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.studentId} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                      <td className="p-4 font-mono text-xs">{s.studentIdSnapshot}</td>
                      <td className="p-4 font-medium">{s.studentNameSnapshot}</td>
                      <td className="p-4 text-center"><AttendanceBadge status={statuses[s.studentId] ?? null} /></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant={statuses[s.studentId] === "PRESENT" ? "success" : "outline"} onClick={() => setStatus(s.studentId, "PRESENT")}><CheckCircle2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant={statuses[s.studentId] === "ABSENT" ? "destructive" : "outline"} onClick={() => setStatus(s.studentId, "ABSENT")}><XCircle className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No students match your filter.</p>}
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <Card key={s.studentId}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.studentNameSnapshot}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.studentIdSnapshot}</p>
                    </div>
                    <AttendanceBadge status={statuses[s.studentId] ?? null} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setStatus(s.studentId, "PRESENT")}
                      className={cn("flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all",
                        statuses[s.studentId] === "PRESENT" ? "border-success bg-success text-success-foreground shadow" : "border-border bg-background active:scale-95")}
                      aria-label={`Mark ${s.studentNameSnapshot} present`}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Present
                    </button>
                    <button
                      onClick={() => setStatus(s.studentId, "ABSENT")}
                      className={cn("flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all",
                        statuses[s.studentId] === "ABSENT" ? "border-destructive bg-destructive text-destructive-foreground shadow" : "border-border bg-background active:scale-95")}
                      aria-label={`Mark ${s.studentNameSnapshot} absent`}
                    >
                      <XCircle className="h-4 w-4" /> Absent
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No students match.</CardContent></Card>}
          </div>

          {/* Sticky bottom action bar (mobile) + regular actions (desktop) */}
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
            <Button size="sm" variant="outline" onClick={() => markAll("PRESENT")}><CheckCheck className="h-4 w-4" /> All Present</Button>
            <Button size="sm" variant="outline" onClick={() => markAll("ABSENT")}><XCircle className="h-4 w-4" /> All Absent</Button>
            <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</Button>
            <Button size="sm" variant="secondary" onClick={autosave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button>
            <Button size="sm" className="ml-auto" onClick={() => setConfirmOpen(true)} disabled={submitting || marked < students.length}>
              <Send className="h-4 w-4" /> Submit ({marked}/{students.length})
            </Button>
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Submit attendance?</h3>
              <p className="text-sm text-muted-foreground">
                {present} present, {absent} absent out of {students.length} students. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Yes, Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TakeAttendancePage() {
  return <Suspense fallback={<PageSkeleton />}><TakeAttendance /></Suspense>;
}
