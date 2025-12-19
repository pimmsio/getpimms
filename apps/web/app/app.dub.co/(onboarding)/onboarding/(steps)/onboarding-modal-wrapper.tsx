"use client";

import { Modal } from "@dub/ui";
import { PropsWithChildren, useEffect, useState } from "react";

export function OnboardingModalWrapper({ children }: PropsWithChildren) {
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-onboarding-blur", "true");
    return () => {
      document.documentElement.removeAttribute("data-onboarding-blur");
    };
  }, []);

  const handleClose = () => {
    // Prevent closing during onboarding
    return;
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={handleClose}
      preventDefaultClose
      className="max-w-2xl max-h-[85vh]"
      overlayClassName="onboarding-glass-overlay"
    >
      <div className="bg-white rounded-2xl p-6 sm:p-8 h-full">{children}</div>
    </Modal>
  );
}
