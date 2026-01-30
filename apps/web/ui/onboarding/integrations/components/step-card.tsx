"use client";

import { cn } from "@dub/utils";
import React from "react";

export function StepCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Minimal but readable: clear separation without heavy chrome.
        "rounded-lg border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-neutral-600">{description}</div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

