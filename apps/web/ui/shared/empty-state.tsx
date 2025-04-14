"use client";

import { buttonVariants, EmptyState as EmptyStateBlock } from "@dub/ui";
import { cn } from "@dub/utils";
import Link from "next/link";
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
        <Link
          href={buttonLink}
          {...(buttonLink.startsWith("http") ? { target: "_blank" } : {})}
          className={cn(
            buttonVariants(),
            "mt-4 flex h-9 items-center justify-center rounded-md border px-4 text-sm",
          )}
        >
            {buttonText}
        </Link>
      )}
    </EmptyStateBlock>
  );
}
