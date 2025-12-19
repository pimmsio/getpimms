"use client";

import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export function HelpTooltip({
  content,
  label = "Help",
  className,
}: {
  content: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Tooltip
      content={
        typeof content === "string" ? (
          <div className="max-w-xs px-3 py-2 text-xs text-neutral-700">
            {content}
          </div>
        ) : (
          content
        )
      }
    >
      <button
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full",
          "border border-neutral-200 bg-white text-[11px] font-medium text-neutral-500",
          "transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
          className,
        )}
      >
        ?
      </button>
    </Tooltip>
  );
}


