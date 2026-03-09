"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { CurrencyToggle } from "@/ui/workspaces/pricing/currency-toggle";
import { CircleCheckFill, GiftFill, Modal, Xmark } from "@dub/ui";
import {
  BillingCurrency,
  APP_DOMAIN,
  getPlanPrice,
} from "@dub/utils";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { markTrialModalShown } from "@/lib/trial/trial-storage";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { mutate } from "swr";
import { toast } from "sonner";

const PRO_TRIAL_FEATURES = [
  { text: "1,000 links /month" },
  { text: "10k events tracked /month" },
  { text: "5 custom domains" },
  { text: "A/B testing" },
  { text: "Webhooks & API" },
  { text: "Priority support" },
];

const TIMELINE_STEPS = [
  {
    day: "Today",
    description: "Unlock all features of the Pro Plan",
    icon: "unlock" as const,
  },
  {
    day: "Day 5",
    description: "Get a reminder that your trial is about to end",
    icon: "bell" as const,
  },
  {
    day: "Day 7",
    description: "Your subscription starts. Cancel anytime.",
    icon: "start" as const,
  },
];

function TimelineIcon({ type }: { type: "unlock" | "bell" | "start" }) {
  const base =
    "flex size-10 items-center justify-center rounded-xl bg-white/20 text-white";
  if (type === "unlock") {
    return (
      <div className={base}>
        <GiftFill className="size-5" />
      </div>
    );
  }
  if (type === "bell") {
    return (
      <div className={base}>
        <svg
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className={base}>
      <svg
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </div>
  );
}

function ProTrialModalHelper({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    id: workspaceId,
    slug: workspaceSlug,
    currency: workspaceCurrency,
    mutate: mutateWorkspace,
  } = useWorkspace();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<BillingCurrency | null>(null);

  const currency: BillingCurrency =
    pendingCurrency ?? (workspaceCurrency as BillingCurrency) ?? "EUR";
  const monthlyPrice = getPlanPrice("pro", "monthly", currency);

  const handleCurrencyChange = useCallback(
    async (next: BillingCurrency) => {
      if (!workspaceId || next === currency) return;
      setPendingCurrency(next);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: next }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error?.message ?? "Failed to update currency");
        }
        await Promise.all([mutate("/api/workspaces"), mutateWorkspace()]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update currency",
        );
      } finally {
        setPendingCurrency(null);
      }
    },
    [workspaceId, mutateWorkspace, currency],
  );

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...(currency === "USD" && { currencyDisplay: "narrowSymbol" as const }),
  }).format(monthlyPrice);

  const handleStartTrial = async () => {
    if (!workspaceSlug) return;
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const baseUrl = `${APP_DOMAIN}${pathname}${queryString.length > 0 ? `?${queryString}` : ""}`;

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/billing/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "pro",
            period: "monthly",
            baseUrl,
            currency,
            trial: true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create checkout session");
      }

      const data = await response.json();
      const { url } = data as { url?: string };
      if (!url) throw new Error("Stripe checkout URL missing");

      if (workspaceId) markTrialModalShown(workspaceId);
      posthog.capture("trial_checkout_opened", { plan: "Pro" });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={() => {
        if (workspaceId) markTrialModalShown(workspaceId);
      }}
      className="max-h-[90vh] max-w-lg border-0 p-0 sm:rounded-2xl"
    >
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-[#3970ff] to-[#1a4fd0] px-4 pb-5 pt-4 text-white md:px-6 md:pb-8 md:pt-6">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setShowModal(false)}
          className="absolute right-3 top-3 z-10 rounded-lg p-1 text-white/70 transition-colors hover:text-white md:right-4 md:top-4"
        >
          <Xmark className="size-5" />
        </button>

        <h2 className="text-center text-xl font-bold md:text-2xl">
          Start your free trial
        </h2>
        <p className="mt-1 text-center text-sm text-white/80">
          7 days free on the{" "}
          <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
            Pro Plan
          </span>
        </p>

        {/* Feature grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 md:mt-6 md:gap-x-6 md:gap-y-2.5">
          {PRO_TRIAL_FEATURES.map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-1.5 text-xs text-white/90 md:gap-2 md:text-sm"
            >
              <CircleCheckFill className="size-3.5 shrink-0 text-amber-300 md:size-4" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline -- desktop only */}
      <div className="hidden bg-gradient-to-b from-[#2a55c0] to-[#1e3a8a] px-6 py-6 md:block">
        <div className="space-y-0">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step.day} className="flex gap-4">
              <div className="flex flex-col items-center">
                <TimelineIcon type={step.icon} />
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className="my-1 h-6 w-px bg-white/20" />
                )}
              </div>
              <div className="pt-2">
                <div className="text-sm font-bold text-white">{step.day}</div>
                <div className="text-sm text-white/70">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-4 md:px-6 md:py-5">
        <div className="mb-3 flex flex-col items-center gap-1.5 md:mb-4 md:gap-2">
          <CurrencyToggle value={currency} onChange={handleCurrencyChange} />
          <p className="text-xs text-neutral-500 md:text-sm">
            Free for 7 days, then{" "}
            <span className="font-semibold text-neutral-900">
              {formattedPrice}/mo
            </span>
          </p>
        </div>
        <AppButton
          variant="primary"
          className="h-10 w-full rounded-xl text-sm md:h-12 md:text-base"
          loading={loading}
          onClick={handleStartTrial}
        >
          Start free trial
        </AppButton>
        <p className="mt-3 text-center text-xs text-neutral-400 md:mt-4">
          By using our service you accept our{" "}
          <a
            href="https://pimms.io/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-600"
          >
            terms &amp; conditions
          </a>{" "}
          &amp;{" "}
          <a
            href="https://pimms.io/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-600"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </Modal>
  );
}

export function useProTrialModal() {
  const [showProTrialModal, setShowProTrialModal] = useState(false);

  const ProTrialModal = useCallback(() => {
    return (
      <ProTrialModalHelper
        showModal={showProTrialModal}
        setShowModal={setShowProTrialModal}
      />
    );
  }, [showProTrialModal, setShowProTrialModal]);

  return useMemo(
    () => ({ setShowProTrialModal, ProTrialModal }),
    [ProTrialModal],
  );
}
