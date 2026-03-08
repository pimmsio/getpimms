"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { hasTrialModalBeenShown } from "@/lib/trial/trial-storage";
import { ModalContext } from "@/ui/modals/modal-provider";
import { useContext, useEffect, useRef } from "react";
import { ProTrialBanner } from "./pro-trial-banner";

/**
 * Renders the Pro trial banner and auto-shows the trial modal
 * on first dashboard visit for free-plan users who haven't used their trial.
 * Only shows to workspace owners (members can't manage billing).
 */
export function ProTrialWrapper() {
  const {
    id: workspaceId,
    plan,
    trialUsed,
    loading,
    isOwner,
  } = useWorkspace();
  const { setShowProTrialModal } = useContext(ModalContext);

  // Track which workspace we last auto-showed for so we re-trigger on workspace switch
  const lastAutoShowWorkspaceRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !workspaceId || plan !== "free" || trialUsed || !isOwner) {
      return;
    }

    if (lastAutoShowWorkspaceRef.current === workspaceId) {
      return;
    }

    if (!hasTrialModalBeenShown(workspaceId)) {
      lastAutoShowWorkspaceRef.current = workspaceId;
      const timer = setTimeout(() => setShowProTrialModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, workspaceId, plan, trialUsed, isOwner, setShowProTrialModal]);

  if (!isOwner) return null;

  return <ProTrialBanner />;
}
