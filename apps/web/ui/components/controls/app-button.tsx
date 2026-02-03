"use client";

import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import Link from "next/link";
import { ComponentProps, forwardRef, ReactNode } from "react";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "muted"
  | "ghost";
export type AppButtonSize = "sm" | "md";

const base =
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const sizes: Record<AppButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-10 px-3",
};

const variants: Record<AppButtonVariant, string> = {
  // Strong primary = brand blue (use for main CTAs like “Create link”).
  primary: "bg-brand-primary text-white hover:bg-brand-primary-hover",
  secondary: "bg-white text-neutral-900 hover:bg-neutral-50",
  outline:
    "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
  muted: "bg-neutral-100/60 text-neutral-900 hover:bg-neutral-100",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100/60",
};

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3.5 animate-spin rounded-full border-2 border-current border-b-transparent",
        className,
      )}
    />
  );
}

export type AppButtonProps = {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
  children: ReactNode;
  loading?: boolean;
  /** When set, the loading spinner replaces this icon (no extra icon when loading). */
  icon?: ReactNode;
  disabledTooltip?: ReactNode | string;
} & ComponentProps<"button">;

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      className,
      children,
      loading,
      icon,
      disabledTooltip,
      ...props
    },
    ref,
  ) => {
    const isDisabled = props.disabled || loading;

    const button = (
      <button
        ref={ref}
        {...props}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(base, sizes[size], variants[variant], className)}
      >
        {loading ? (
          <>
            <Spinner className="mr-2 shrink-0 opacity-80" />
            <span className={icon ? undefined : "opacity-70"}>{children}</span>
          </>
        ) : icon != null ? (
          <>
            <span className="shrink-0">{icon}</span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );

    if (disabledTooltip && isDisabled) {
      return (
        <Tooltip content={disabledTooltip}>
          <span className="inline-flex">{button}</span>
        </Tooltip>
      );
    }

    return button;
  },
);
AppButton.displayName = "AppButton";

export type AppButtonLinkProps = {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
  children: ReactNode;
} & ComponentProps<typeof Link>;

export const AppButtonLink = forwardRef<HTMLAnchorElement, AppButtonLinkProps>(
  (
    { variant = "secondary", size = "md", className, children, ...props },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        {...props}
        className={cn(base, sizes[size], variants[variant], className)}
      >
        {children}
      </Link>
    );
  },
);
AppButtonLink.displayName = "AppButtonLink";
