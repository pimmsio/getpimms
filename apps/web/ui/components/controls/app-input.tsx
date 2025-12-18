"use client";

import { cn } from "@dub/utils";
import { ComponentProps, forwardRef } from "react";

export const AppInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          "h-10 w-full rounded-lg bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
          className,
        )}
      />
    );
  },
);
AppInput.displayName = "AppInput";
