import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_60%)]" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <GraduationCap className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Attendance</h1>
            <p className="text-sm text-muted-foreground">
              IoT-powered attendance management system
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
