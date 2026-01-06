"use client";

import { PaywallContent } from "@/ui/workspaces/pricing/paywall-content";
import { Modal } from "@dub/ui";
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
  return (
    <Modal
      showModal={showPaywallModal}
      setShowModal={setShowPaywallModal}
      className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-neutral-100 px-5 py-4">
        <div className="text-base font-semibold text-neutral-900">
          Upgrade your plan
        </div>
      </div>

      <div className="dub-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
        <div className="px-5 py-6 pb-10">
          <PaywallContent />
        </div>
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
