"use client";

import { ModalContext } from "@/ui/modals/modal-provider";
import { useContext } from "react";

/**
 * Hook to open the upgrade/paywall modal
 * Use this instead of navigating to `?upgrade=1` query parameter
 */
export function useUpgradeModal() {
  const { setShowPaywallModal } = useContext(ModalContext);

  const openUpgradeModal = () => {
    setShowPaywallModal(true);
  };

  return { openUpgradeModal };
}

