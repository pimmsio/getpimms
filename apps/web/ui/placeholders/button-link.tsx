"use client";

import { AppButtonLink } from "@/ui/components/controls/app-button";
import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

export function ButtonLink({
  variant,
  className,
  children,
  ...rest
}: {
  variant?: "primary" | "secondary" | "muted" | "ghost";
  className?: string;
  children: ReactNode;
} & ComponentProps<typeof Link>) {
  return (
    <AppButtonLink
      {...rest}
      variant={variant ?? "secondary"}
      size="md"
      className={className}
    >
      {children}
    </AppButtonLink>
  );
}
