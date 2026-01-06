"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import { MaxWidthWrapper } from "@dub/ui";
import { CursorRays } from "../layout/sidebar/icons/cursor-rays";
import { AnimatedEmptyState } from "../shared/animated-empty-state";

export default function WorkspaceExceededClicks() {
  const { nextPlan } = useWorkspace();
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <MaxWidthWrapper>
      <div className="my-10 flex flex-col items-center justify-center rounded border border-neutral-100 bg-white py-12">
        <AnimatedEmptyState
          title="Stats Locked"
          description="Your workspace has exceeded your monthly events limit. We're still collecting data on your links, but you need to upgrade to view them."
          cardContent={() => (
            <>
              <CursorRays className="size-4 text-neutral-700" />
              <div className="h-2.5 w-24 min-w-0 rounded bg-neutral-200" />
            </>
          )}
          className="border-none"
          learnMoreText={
            nextPlan ? `Upgrade to ${nextPlan.name}` : "Contact support"
          }
          onLearnMoreClick={nextPlan ? openUpgradeModal : undefined}
          learnMoreHref={nextPlan ? undefined : "https://pimms.io/contact"}
        />
      </div>
    </MaxWidthWrapper>
  );
}
