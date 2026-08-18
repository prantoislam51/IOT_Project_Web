"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface UserMenuProps {
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

export function TopbarActions({ user }: { user: UserMenuProps }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9">
              {user.profileImage ? <AvatarImage src={user.profileImage} alt={user.name} /> : null}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-1 text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-wide text-primary">{user.role}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
            <UserRound aria-hidden />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
