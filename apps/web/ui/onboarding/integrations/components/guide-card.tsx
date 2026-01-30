"use client";

import { cn } from "@dub/utils";
import { BookOpen, ExternalLink } from "lucide-react";
import React from "react";

export function GuideCard({
  title = "Guide",
  description = "Keep the guide handy while you complete the steps.",
  href,
  thumbnail,
  className,
}: {
  title?: string;
  description?: string;
  href: string;
  thumbnail?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`${title} thumbnail`}
            className="h-10 w-16 shrink-0 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-10 w-16 shrink-0 rounded bg-neutral-100" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <BookOpen className="size-4" />
            {title}
          </div>
          {description ? (
            <div className="mt-0.5 text-xs text-neutral-600">{description}</div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Open guide
          <ExternalLink className="size-4 text-neutral-500" />
        </a>
      </div>
    </div>
  );
}

