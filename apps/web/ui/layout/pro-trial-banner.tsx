"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import {
  dismissTrialBanner,
  isTrialBannerDismissed,
} from "@/lib/trial/trial-storage";
import { ModalContext } from "@/ui/modals/modal-provider";
import { GiftFill, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { useContext, useEffect, useState } from "react";

export function ProTrialBanner() {
  const { id: workspaceId, plan, trialUsed, loading, isOwner } = useWorkspace();
  const { setShowProTrialModal } = useContext(ModalContext);
  const [dismissed, setDismissedState] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      setDismissedState(isTrialBannerDismissed(workspaceId));
    }
  }, [workspaceId]);

  if (loading || plan !== "free" || trialUsed || dismissed || !isOwner) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "rounded-xl bg-gradient-to-r from-[#1e3a8a] via-[#2a55c0] to-[#3970ff] md:rounded-2xl",
        "px-3.5 py-2.5 md:px-5 md:py-3",
      )}
    >
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => {
          if (workspaceId) {
            dismissTrialBanner(workspaceId);
            setDismissedState(true);
          }
        }}
        aria-label="Dismiss trial banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/60 transition-colors hover:text-white md:right-3"
      >
        <Xmark className="size-3.5 md:size-4" />
      </button>

      {/* Mobile: compact single row */}
      <button
        type="button"
        onClick={() => setShowProTrialModal(true)}
        className="flex w-full items-center gap-3 pr-6 text-left md:hidden"
      >
        <GiftFill className="size-5 shrink-0 text-white" />
        <span className="min-w-0 flex-1 text-sm font-semibold text-white">
          Start your free Pro Trial <span className="text-amber-300">✦</span>
        </span>
        <span className="shrink-0 whitespace-nowrap rounded-md border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          Try free
        </span>
      </button>

      {/* Desktop: full layout */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <GiftFill className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Start your free Pro Trial{" "}
              <span className="text-amber-300">✦</span>
            </p>
            <p className="text-xs text-white/70">
              Access all Pro features for free for 7 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-5">
          <button
            type="button"
            onClick={() => setShowProTrialModal(true)}
            className="whitespace-nowrap rounded-lg border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Start for free
          </button>
        </div>
      </div>
    </div>
  );
}
