"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { UpgradePlanButton } from "@/ui/workspaces/upgrade-plan-button";
import { Check } from "@dub/ui";
import {
  BillingCurrency,
  cn,
  getPlanPrice,
  INFINITY_NUMBER,
  nFormatter,
  PLANS,
} from "@dub/utils";
import { useCallback, useMemo, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { CurrencyToggle } from "./currency-toggle";
import { PaidPlanId, PaidPlanPicker } from "./paid-plan-picker";
import { PricingOptionCard } from "./pricing-option-card";

const ALL_PAID_FEATURES = [
  "100+ integrations incl. Zapier",
  "Support Stripe payments",
  "A/B testing",
  "Webhooks & API",
  "Bulk Link Builder",
  "Custom QR code",
  "Advanced link options",
  "UTM rules, groupings & templates",
];

function formatCount(val: number) {
  return val === INFINITY_NUMBER ? "Unlimited" : nFormatter(val, { full: true });
}

function getPlanSpecificBullets(planName: "pro" | "business") {
  const plan = PLANS.find((p) => p.name.toLowerCase() === planName)!;
  const links = plan.limits.links;
  const events = plan.limits.clicks;
  const folders = plan.limits.folders;
  const domains = plan.limits.domains;
  const users = plan.limits.users;
  const retention = plan.limits.retention;
  const utmTemplates = plan.limits.utmTemplates;

  const perMonthSuffix = (n: number) => (n === INFINITY_NUMBER ? "" : "/month");

  const bulkLinks = plan.limits.bulkLinks ?? 0;

  return [
    `${formatCount(links)} new links${perMonthSuffix(links)}`,
    `${formatCount(events)} events tracked${perMonthSuffix(events)}`,
    `${formatCount(folders)} extra folder${folders === 1 ? "" : "s"}`,
    `${formatCount(domains)} custom domain${domains === 1 ? "" : "s"}`,
    `${formatCount(users)} team member${users === 1 ? "" : "s"}`,
    `${retention} analytics retention`,
    `${formatCount(utmTemplates)} UTM templates`,
    `${nFormatter(bulkLinks, { full: true })} links at a time in Bulk Link Builder`,
    planName === "business" ? "Priority support" : "3 months priority support",
  ];
}

function FeatureList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((text) => (
        <li key={text} className="flex items-start gap-2 text-sm text-neutral-700">
          <Check className="mt-0.5 size-4 text-neutral-500" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export function PaywallContent({
  className,
}: {
  className?: string;
}) {
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

  const defaultSelectedPaidPlan = useMemo<PaidPlanId>(() => {
    if (currentPlan === "pro") return "pro";
    if (currentPlan === "business") return "business";
    return "pro";
  }, [currentPlan]);

  const [selectedPaidPlan, setSelectedPaidPlan] =
    useState<PaidPlanId>(defaultSelectedPaidPlan);

  const selectedPlan = PLANS.find((p) => p.name.toLowerCase() === selectedPaidPlan)!;

  const includedInSelectedPlan = useMemo(
    () => getPlanSpecificBullets(selectedPaidPlan),
    [selectedPaidPlan],
  );

  const primaryCta =
    selectedPaidPlan === "business" ? "Subscribe yearly" : "Subscribe monthly";

  const monthlyBusiness = getPlanPrice("business", "monthly", currency);
  const yearlyBusiness = getPlanPrice("business", "yearly", currency);

  return (
    <div className={cn("w-full", className)}>
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
                  text="Subscribe monthly"
                />
              }
            />
            <PricingOptionCard
              title="Lifetime"
              price={getPlanPrice("pro", "lifetime", currency)}
              periodLabel=""
              currency={currency}
              badge="Most popular"
              helperTop={<span className="font-medium">One-time payment</span>}
              cta={
                <UpgradePlanButton
                  plan="pro"
                  period="monthly"
                  mode="lifetime"
                  currency={currency}
                  className="h-10 w-full rounded-lg"
                  variant="primary"
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
                  text="Subscribe monthly"
                />
              }
            />
            <PricingOptionCard
              title="Yearly"
              price={yearlyBusiness}
              periodLabel="/year"
              currency={currency}
              badge="Most popular"
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
                  text="Subscribe yearly"
                />
              }
            />
          </>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="text-sm font-semibold text-neutral-900">
            Included in <span className="capitalize">{selectedPaidPlan}</span> plan
          </div>
          <div className="mt-3">
            <FeatureList items={includedInSelectedPlan} />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-neutral-900">
            Included in all paid plans
          </div>
          <div className="mt-3">
            <FeatureList items={ALL_PAID_FEATURES} />
          </div>
        </div>
      </div>
    </div>
  );
}


