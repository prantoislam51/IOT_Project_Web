import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/models";
import { SidebarLogo, SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { TopbarActions } from "@/components/layout/topbar-actions";
import { LiveClock } from "@/components/layout/live-clock";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const settings = await getSystemSettings();
  const role = session?.user.role ?? "TEACHER";
  const user = {
    name: session?.user.name ?? "User",
    email: session?.user.email ?? "",
    role,
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <SidebarLogo institution={settings.institutionName} />
        <SidebarNav role={role} />
        <div className="border-t px-5 py-4">
          <p className="text-xs text-muted-foreground">
            {settings.institutionName}
            <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
              ESP32 Attendance Display v1.0
            </span>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <MobileSidebar role={role} institution={settings.institutionName} />
            <LiveClock timezone={settings.timezone} />
          </div>
          <TopbarActions user={user} />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
