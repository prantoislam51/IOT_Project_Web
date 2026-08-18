"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  ClipboardCheck,
  History,
  BarChart3,
  MonitorSmartphone,
  Settings,
  GraduationCap as LogoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export function getNavSections(role: "ADMIN" | "TEACHER"): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Reports", href: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "Attendance",
      items: [
        { label: "Take Attendance", href: "/attendance/take", icon: ClipboardCheck },
        { label: "Attendance History", href: "/attendance/history", icon: History },
      ],
    },
  ];

  if (role === "ADMIN") {
    sections.splice(1, 0, {
      title: "Management",
      items: [
        { label: "Students", href: "/students", icon: Users },
        { label: "Teachers", href: "/teachers", icon: GraduationCap },
        { label: "Courses", href: "/courses", icon: BookOpen },
        { label: "Classes", href: "/classes", icon: School },
      ],
    });
    sections.push({
      title: "System",
      items: [
        { label: "IoT Devices", href: "/devices", icon: MonitorSmartphone },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    });
  } else {
    sections.push({
      title: "Teaching",
      items: [{ label: "My Classes", href: "/classes", icon: School }],
    });
  }

  return sections;
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: "ADMIN" | "TEACHER";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavSections(role);

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/attendance/take" && pathname === "/attendance") ||
                (item.href === "/attendance/history" && pathname.startsWith("/attendance/"));
              return (
                <li key={item.href}>
                  <Button
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 px-3 font-medium",
                      active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Link href={item.href} onClick={onNavigate}>
                      <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                      {item.label}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarLogo({ institution }: { institution: string }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 border-b px-5 py-4 transition-opacity hover:opacity-80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <LogoIcon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-tight">Smart Attendance</span>
        <span className="block truncate text-xs text-muted-foreground">{institution}</span>
      </span>
    </Link>
  );
}
