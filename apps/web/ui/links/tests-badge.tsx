"use client";

import { cn } from "@dub/utils";
import * as HoverCard from "@radix-ui/react-hover-card";
import { useLinkCardContext } from "./link-card";
import { ResponseLink } from "./links-container";

export function TestsBadge({
  link,
}: {
  link: Pick<ResponseLink, "testVariants" | "testCompletedAt">;
}) {
  const { showTests, setShowTests } = useLinkCardContext();

  return (
    <div>
      <HoverCard.Root openDelay={100}>
        <HoverCard.Trigger>
          <button
            type="button"
            className={cn(
              "rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 transition-[box-shadow,border-color] duration-100 hover:border-neutral-300",
              showTests && "ring-1 ring-neutral-200/70",
            )}
            aria-pressed={showTests}
            onClick={() => setShowTests((s) => !s)}
          >
            A/B
          </button>
        </HoverCard.Trigger>
      </HoverCard.Root>
    </div>
  );
}
