"use client";

import { AppButtonLink } from "@/ui/components/controls/app-button";
import { EmptyState as EmptyStateBlock } from "@dub/ui";
import { ComponentProps } from "react";

export default function EmptyState({
  buttonText,
  buttonLink,
  ...rest
}: {
  buttonText?: string;
  buttonLink?: string;
} & Omit<ComponentProps<typeof EmptyStateBlock>, "children">) {
  return (
    <EmptyStateBlock {...rest}>
      {buttonText && buttonLink && (
        <AppButtonLink
          href={buttonLink}
          {...(buttonLink.startsWith("http") ? { target: "_blank" } : {})}
          variant="secondary"
          size="sm"
          className="mt-4"
        >
          {buttonText}
        </AppButtonLink>
      )}
    </EmptyStateBlock>
  );
}
