"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useWorkspace from "@/lib/swr/use-workspace";
import { getConversionProviderDisplayName } from "@/ui/layout/sidebar/conversions/conversions-onboarding-modal";
import { Modal } from "@dub/ui";
import { cn } from "@dub/utils";
import { useMemo, useState } from "react";

const BOOK_TRACKING_MEETING_URL = "https://pim.ms/dAXN6jl";

function isOtherProviderId(id: string) {
  return id.startsWith("other");
}

export function CustomSetupSupportModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
}) {
  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="w-full max-w-[100vw] sm:max-w-xl"
    >
      <CustomSetupSupportContent onClose={() => setShowModal(false)} />
    </Modal>
  );
}

export function CustomSetupSupportContent({
  onClose,
  closeLabel = "Close",
}: {
  onClose?: () => void;
  closeLabel?: string;
}) {
  const { slug: workspaceSlug } = useWorkspace();
  const { providerIds } = useOnboardingPreferences();

  const selectedStacks = useMemo(() => {
    return (providerIds || []).map((id) => ({
      id,
      label: getConversionProviderDisplayName(id) || id,
      isOther: isOtherProviderId(id),
    }));
  }, [providerIds]);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
      <div className="text-sm font-semibold text-neutral-900">
        Contact support for custom setup
      </div>
      <div className="mt-1 text-sm text-neutral-600">
        Tell us what you use and what you want to track.
      </div>

      <textarea
        className="mt-4 block w-full resize-none rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:ring-0 focus:outline-none"
        rows={6}
        placeholder="Example: We use X for payments and Y for forms. We want to track leads and sales and attribute them to clicks."
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setSent(false);
        }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={sending || message.trim().length === 0}
          className={cn(
            "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800",
            (sending || message.trim().length === 0) &&
              "cursor-not-allowed opacity-60",
          )}
          onClick={async () => {
            setSending(true);
            try {
              await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: [
                    "Custom setup request",
                    `Workspace: ${workspaceSlug || "unknown"}`,
                    `Selected stacks: ${
                      selectedStacks.length > 0
                        ? selectedStacks.map((s) => s.label).join(", ")
                        : "none"
                    }`,
                    "",
                    message.trim(),
                  ].join("\n"),
                  attachmentIds: [],
                }),
              });
              setSent(true);
            } finally {
              setSending(false);
            }
          }}
        >
          {sent ? "Sent" : sending ? "Sending…" : "Send"}
        </button>

        <a
          href={BOOK_TRACKING_MEETING_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Book a call with an expert
        </a>

        {onClose ? (
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            onClick={() => onClose()}
            disabled={sending}
          >
            {closeLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

