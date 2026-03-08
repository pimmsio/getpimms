"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { PaywallContent } from "@/ui/workspaces/pricing/paywall-content";
import { Modal, Xmark } from "@dub/ui";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

function PaywallModalHelper({
  showPaywallModal,
  setShowPaywallModal,
}: {
  showPaywallModal: boolean;
  setShowPaywallModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { plan: currentPlan } = useWorkspace();

  return (
    <Modal
      showModal={showPaywallModal}
      setShowModal={setShowPaywallModal}
      className="max-h-[90vh] max-w-4xl border-0 p-0 sm:rounded-2xl"
    >
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-[#3970ff] to-[#1a4fd0] px-4 py-4 text-white md:px-6 md:py-5">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setShowPaywallModal(false)}
          className="absolute right-3 top-3 rounded-lg p-1 text-white/70 transition-colors hover:text-white md:right-4 md:top-4"
        >
          <Xmark className="size-5" />
        </button>

        <h2 className="text-lg font-bold md:text-xl">Upgrade your plan</h2>
        <p className="mt-0.5 text-xs text-white/80 md:mt-1 md:text-sm">
          You are currently on the{" "}
          <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white capitalize">
            {currentPlan ?? "Free"}
          </span>{" "}
          plan
        </p>
      </div>

      {/* Content */}
      <div className="bg-white px-4 py-4 pb-8 md:px-6 md:py-6 md:pb-10">
        <PaywallContent hideCurrentPlan />
      </div>
    </Modal>
  );
}

export function usePaywallModal() {
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const PaywallModal = useCallback(() => {
    return (
      <PaywallModalHelper
        showPaywallModal={showPaywallModal}
        setShowPaywallModal={setShowPaywallModal}
      />
    );
  }, [showPaywallModal, setShowPaywallModal]);

  return useMemo(() => ({ setShowPaywallModal, PaywallModal }), [PaywallModal]);
}
