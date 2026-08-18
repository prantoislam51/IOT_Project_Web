import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action?.href && (
          <Button asChild size="sm" className="mt-1">
            <a href={action.href}>{action.label}</a>
          </Button>
        )}
        {action?.onClick && (
          <Button size="sm" className="mt-1" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
