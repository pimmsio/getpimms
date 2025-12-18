"use client";

import { Modal } from "@dub/ui";
import { PropsWithChildren, useEffect, useState } from "react";

export function OnboardingModalWrapper({ children }: PropsWithChildren) {
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const handleClose = () => {
    // Prevent closing during onboarding
    return;
  };

  // Don't render modal if there's no content
  if (!children) {
    return null;
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={handleClose}
      preventDefaultClose
      className="max-w-2xl"
    >
      <div className="bg-white rounded-2xl p-8">{children}</div>
    </Modal>
  );
}
