"use client";

import { cn } from "@dub/utils";
import { ComponentProps, forwardRef } from "react";

export const AppTextarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        // Match AppInput: rounded-lg, h-10 baseline sizing, neutral focus ring.
        // Textareas need vertical padding + a sensible min-height.
        "w-full rounded-lg bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        className,
      )}
    />
  );
});

AppTextarea.displayName = "AppTextarea";


