"use client";

import { cn } from "@dub/utils";
import Link from "next/link";
import { ComponentProps, forwardRef } from "react";

const base =
  "inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed";

export const AppIconButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>(({ className, children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} className={cn(base, className)}>
      {children}
    </button>
  );
});
AppIconButton.displayName = "AppIconButton";

export const AppIconLink = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof Link>
>(({ className, children, ...props }, ref) => {
  return (
    <Link ref={ref} {...props} className={cn(base, className)}>
      {children}
    </Link>
  );
});
AppIconLink.displayName = "AppIconLink";
