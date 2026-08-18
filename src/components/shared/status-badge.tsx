import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MinusCircle, Circle } from "lucide-react";

export function AttendanceBadge({ status }: { status: "PRESENT" | "ABSENT" | null | undefined }) {
  if (status === "PRESENT") {
    return (
      <Badge variant="success" className="gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Present
      </Badge>
    );
  }
  if (status === "ABSENT") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        Absent
      </Badge>
    );
  }
  return (
    <Badge variant="muted" className="gap-1.5">
      <MinusCircle className="h-3.5 w-3.5" aria-hidden />
      Unmarked
    </Badge>
  );
}

const sessionVariant = {
  DRAFT: "muted",
  ACTIVE: "warning",
  SUBMITTED: "success",
  CANCELLED: "destructive",
} as const;

export function SessionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={sessionVariant[status as keyof typeof sessionVariant] ?? "muted"}>
      {status}
    </Badge>
  );
}

export function UserStatusBadge({ status }: { status: string }) {
  return status === "ACTIVE" ? (
    <Badge variant="success" className="gap-1.5">
      <Circle className="h-2 w-2 fill-current" aria-hidden />
      Active
    </Badge>
  ) : (
    <Badge variant="muted" className="gap-1.5">
      <Circle className="h-2 w-2 fill-current" aria-hidden />
      Inactive
    </Badge>
  );
}
