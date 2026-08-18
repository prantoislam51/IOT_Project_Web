"use client";

import { useEffect, useState } from "react";

export function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return <span className="hidden h-4 w-44 animate-pulse rounded bg-muted sm:block" aria-hidden />;
  }

  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(now);

  return (
    <div className="hidden items-center gap-2 text-sm sm:flex" aria-live="off">
      <span suppressHydrationWarning className="font-medium">
        {time}
      </span>
      <span suppressHydrationWarning className="text-muted-foreground">
        · {date}
      </span>
    </div>
  );
}
