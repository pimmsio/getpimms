"use client";

import { useWebhookErrors } from "@/lib/swr/use-webhook-errors";
import { Modal } from "@dub/ui";
import { Info } from "lucide-react";
import { useState } from "react";
import { WebhookErrorsModal } from "./webhook-errors-modal";

export function WebhookErrorsWarning() {
  const { errors, loading } = useWebhookErrors();
  const [showModal, setShowModal] = useState(false);

  // Don't show warning if there are no recent errors or still loading
  if (loading || errors.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="flex w-full sm:w-fit cursor-pointer items-start gap-2 rounded-xl ring-1 ring-blue-200 bg-blue-50 px-3 py-2 mx-1 md:mx-0 transition-colors hover:bg-blue-100"
        onClick={() => setShowModal(true)}
      >
        <Info className="h-4 w-4 flex-none text-blue-600" />
        <div className="flex items-center gap-1 text-xs text-neutral-700 truncate">
          <span className="truncate">
            {errors.length} lead{errors.length > 1 ? "s" : ""} not matched
          </span>
          <span className="text-neutral-400">•</span>
          <span className="text-blue-700">Details</span>
        </div>
      </div>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        className="max-w-4xl"
      >
        <WebhookErrorsModal onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
