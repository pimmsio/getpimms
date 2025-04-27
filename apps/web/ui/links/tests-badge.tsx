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
              "text-xs rounded-full px-2 py-1.5 text-neutral-800 transition-colors duration-100 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300",
              showTests ? "bg-neutral-300" : "bg-neutral-100",
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
