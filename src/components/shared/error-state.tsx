"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
        </div>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry} className="mt-1">
            <RefreshCw aria-hidden />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
