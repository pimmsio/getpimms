"use client";

import { useWebhookErrors } from "@/lib/swr/use-webhook-errors";
import { Modal } from "@dub/ui";
import { TriangleAlert } from "lucide-react";
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
        className="flex w-full md:w-fit cursor-pointer items-start space-x-2 rounded-xl ring-1 ring-amber-200 bg-amber-50 p-2 mx-1 md:mx-0 transition-colors hover:bg-amber-100"
        onClick={() => setShowModal(true)}
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
        <div className="text-sm text-neutral-700 truncate">
          <span className="hidden md:inline truncate">{errors.length} Lead{errors.length > 1 ? "s" : ""} missed</span>{" "}<span className="italic md:hidden">Missed leads?</span><span className="italic hidden md:inline">View details?</span>
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
