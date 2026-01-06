"use client";

import { PaidPlanId, PaidPlanPicker } from "@/ui/workspaces/pricing/paid-plan-picker";
import { PricingOptionCard } from "@/ui/workspaces/pricing/pricing-option-card";
import { UpgradePlanButton } from "@/ui/workspaces/upgrade-plan-button";
import useWorkspace from "@/lib/swr/use-workspace";
import { getPlanDetails } from "@dub/utils";
import { useMemo, useState } from "react";
import { LaterButton } from "../../later-button";

export function PlanSelector() {
  const { plan: currentPlan } = useWorkspace();

  const currentPlanId = currentPlan;

  const defaultSelectedPaidPlan = useMemo<PaidPlanId>(() => {
    return currentPlanId === "pro" || currentPlanId === "business"
      ? "business"
      : "pro";
  }, [currentPlanId]);

  const [selectedPaidPlan, setSelectedPaidPlan] =
    useState<PaidPlanId>(defaultSelectedPaidPlan);

  const selectedPaidPlanObj = getPlanDetails(selectedPaidPlan);

  return (
    <div className="flex flex-col gap-y-6">
      <LaterButton
        next="support"
        className="font-bold underline-offset-4 hover:underline"
      >
        Skip this step, Start for free
      </LaterButton>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-500">
          You are currently on the{" "}
          <span className="font-medium text-neutral-900 capitalize">{currentPlan}</span>{" "}
          plan
        </div>

        <div className="mt-4">
          <PaidPlanPicker value={selectedPaidPlan} onChange={setSelectedPaidPlan} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {selectedPaidPlan === "pro" ? (
            <>
              <PricingOptionCard
                title="Monthly"
                price={selectedPaidPlanObj.price.monthly!}
                periodLabel="/month"
                cta={
                  <UpgradePlanButton
                    plan="pro"
                    period="monthly"
                    className="h-10 w-full rounded-lg"
                    variant="outline"
                    text="Subscribe"
                  />
                }
              />
              <PricingOptionCard
                title="Lifetime"
                price={selectedPaidPlanObj.price.lifetime!}
                periodLabel=""
                helperTop={<span className="font-medium">One-time payment</span>}
                cta={
                  <UpgradePlanButton
                    plan="pro"
                    period="monthly"
                    mode="lifetime"
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
                price={selectedPaidPlanObj.price.monthly!}
                periodLabel="/month"
                cta={
                  <UpgradePlanButton
                    plan="business"
                    period="monthly"
                    className="h-10 w-full rounded-lg"
                    variant="outline"
                    text="Subscribe"
                  />
                }
              />
              <PricingOptionCard
                title="Yearly"
                price={selectedPaidPlanObj.price.yearly!}
                periodLabel="/year"
                badge="2 months free"
                helperTop={
                  <span className="text-neutral-500">
                    <span className="line-through">€69/month</span>{" "}
                    <span className="text-blue-600">2 months free</span>
                  </span>
                }
                cta={
                  <UpgradePlanButton
                    plan="business"
                    period="yearly"
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
