"use client";

import { AppButtonLink } from "@/ui/components/controls/app-button";
import { EmptyState as EmptyStateBlock } from "@dub/ui";
import { cn } from "@dub/utils";
import { ComponentProps, ReactNode } from "react";

export default function EmptyState({
  buttonText,
  buttonLink,
  variant = "padded",
  containerClassName,
  actions,
  ...rest
}: {
  buttonText?: string;
  buttonLink?: string;
  /**
   * `padded` (default): consistent vertical rhythm for empty content blocks
   * without adding extra “card-on-card” visuals.
   *
   * `plain`: render just the EmptyState content (use when the caller already
   * provides spacing/surface).
   */
  variant?: "padded" | "plain";
  /**
   * Optional wrapper class when `variant="padded"`.
   */
  containerClassName?: string;
  /**
   * Optional custom actions under the description (e.g., button).
   */
  actions?: ReactNode;
} & Omit<ComponentProps<typeof EmptyStateBlock>, "children">) {
  const content = (
    <EmptyStateBlock {...rest}>
      {(buttonText && buttonLink) || actions ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {buttonText && buttonLink && (
            <AppButtonLink
              href={buttonLink}
              {...(buttonLink.startsWith("http") ? { target: "_blank" } : {})}
              variant="secondary"
              size="sm"
            >
              {buttonText}
            </AppButtonLink>
          )}
          {actions}
        </div>
      ) : null}
    </EmptyStateBlock>
  );

  if (variant === "plain") return content;

  return (
    <div
      className={cn(
        "w-full py-14 sm:py-16",
        containerClassName,
      )}
    >
      {content}
    </div>
  );
}
