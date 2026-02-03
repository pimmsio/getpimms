"use client";

import { PaidPlanId, PaidPlanPicker } from "@/ui/workspaces/pricing/paid-plan-picker";
import { PricingOptionCard } from "@/ui/workspaces/pricing/pricing-option-card";
import { CurrencyToggle } from "@/ui/workspaces/pricing/currency-toggle";
import { UpgradePlanButton } from "@/ui/workspaces/upgrade-plan-button";
import useWorkspace from "@/lib/swr/use-workspace";
import { BillingCurrency, getPlanPrice } from "@dub/utils";
import { useCallback, useMemo, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { LaterButton } from "../../later-button";

export function PlanSelector() {
  const {
    id: workspaceId,
    plan: currentPlan,
    currency: workspaceCurrency,
    mutate: mutateWorkspace,
  } = useWorkspace();
  const [pendingCurrency, setPendingCurrency] = useState<BillingCurrency | null>(
    null,
  );
  const currency: BillingCurrency =
    pendingCurrency ??
    ((workspaceCurrency as BillingCurrency) ?? "EUR");

  const handleCurrencyChange = useCallback(
    async (next: BillingCurrency) => {
      if (!workspaceId) return;
      if (next === currency) return;
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
        toast.success("Currency updated");
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

  const currentPlanId = currentPlan;

  const defaultSelectedPaidPlan = useMemo<PaidPlanId>(() => {
    return currentPlanId === "pro" || currentPlanId === "business"
      ? "business"
      : "pro";
  }, [currentPlanId]);

  const [selectedPaidPlan, setSelectedPaidPlan] =
    useState<PaidPlanId>(defaultSelectedPaidPlan);

  const monthlyBusiness = getPlanPrice("business", "monthly", currency);

  return (
    <div className="flex flex-col gap-y-6">
      <LaterButton
        next="support"
        className="font-bold underline-offset-4 hover:underline"
      >
        Skip this step, Start for free
      </LaterButton>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-neutral-500">
            You are currently on the{" "}
            <span className="font-medium text-neutral-900 capitalize">{currentPlan}</span>{" "}
            plan
          </div>
          <CurrencyToggle value={currency} onChange={handleCurrencyChange} />
        </div>

        <div className="mt-4">
          <PaidPlanPicker value={selectedPaidPlan} onChange={setSelectedPaidPlan} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {selectedPaidPlan === "pro" ? (
            <>
              <PricingOptionCard
                title="Monthly"
                price={getPlanPrice("pro", "monthly", currency)}
                periodLabel="/month"
                currency={currency}
                cta={
                  <UpgradePlanButton
                    plan="pro"
                    period="monthly"
                    currency={currency}
                    className="h-10 w-full rounded-lg"
                    variant="outline"
                    text="Subscribe"
                  />
                }
              />
              <PricingOptionCard
                title="Lifetime"
                price={getPlanPrice("pro", "lifetime", currency)}
                periodLabel=""
                currency={currency}
                helperTop={<span className="font-medium">One-time payment</span>}
                cta={
                  <UpgradePlanButton
                    plan="pro"
                    period="monthly"
                    mode="lifetime"
                    currency={currency}
                    className="h-10 w-full rounded-lg"
                    text="Unlock lifetime access"
                  />
                }
              />
            </>
          ) : (
            <>
              <PricingOptionCard
                title="Monthly"
                price={getPlanPrice("business", "monthly", currency)}
                periodLabel="/month"
                currency={currency}
                cta={
                  <UpgradePlanButton
                    plan="business"
                    period="monthly"
                    currency={currency}
                    className="h-10 w-full rounded-lg"
                    variant="outline"
                    text="Subscribe"
                  />
                }
              />
              <PricingOptionCard
                title="Yearly"
                price={getPlanPrice("business", "yearly", currency)}
                periodLabel="/year"
                currency={currency}
                badge="2 months free"
                helperTop={
                  <span className="text-neutral-500">
                    <span className="line-through">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                      ...(currency === "USD" && {
                        currencyDisplay: "narrowSymbol",
                      }),
                    }).format(monthlyBusiness)}
                      /month
                    </span>{" "}
                    <span className="text-blue-600">2 months free</span>
                  </span>
                }
                cta={
                  <UpgradePlanButton
                    plan="business"
                    period="yearly"
                    currency={currency}
                    className="h-10 w-full rounded-lg"
                    variant="primary"
                    text="Subscribe"
                  />
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
