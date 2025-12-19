"use client";

import { cn } from "@dub/utils";
import { User } from "lucide-react";

export function AnonymousVisitorsTeaser({
  className,
  variant = "card",
}: {
  className?: string;
  variant?: "card" | "plain";
}) {
  // API call removed - showing example data only
  const hasReal = false;

  const containerClass = cn(
    "text-left",
    variant === "card" && "rounded-lg border border-neutral-100 bg-white p-4",
  );

  return (
    <section className={cn(containerClass, className)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <span>Recent clicks</span>
        </div>
        {!hasReal ? (
          <span className="text-xs text-neutral-500">Example data</span>
        ) : null}
      </header>

      <div
        className={cn(
          "mt-2",
          variant === "card" &&
            "overflow-hidden rounded-md border border-neutral-100 bg-white",
        )}
      >
        <div className={cn("divide-y divide-neutral-100", variant === "plain" && "rounded-md border border-neutral-200/60 bg-white")}>
          {[
            {
              key: "ex-1",
              title: "Anonymous visitor",
              meta: "Click · 2m ago · email",
              identified: false,
            },
            {
              key: "ex-2",
              title: "Anonymous visitor",
              meta: "Click · 11m ago · social",
              identified: false,
            },
            {
              key: "ex-3",
              title: "Anonymous visitor",
              meta: "Click · 38m ago · direct",
              identified: false,
            },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-200/70",
                    !row.identified && "blur-[0.8px]",
                  )}
                >
                  <User className="size-4 text-neutral-600/70" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {row.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{row.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


