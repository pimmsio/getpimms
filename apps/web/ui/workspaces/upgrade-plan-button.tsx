"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton, AppButtonProps } from "@/ui/components/controls/app-button";
import { APP_DOMAIN, capitalize, cn, SELF_SERVE_PAID_PLANS } from "@dub/utils";
import { usePlausible } from "next-plausible";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";

export function UpgradePlanButton({
  plan,
  period,
  mode = "subscription",
  className,
  text,
  ...rest
}: {
  plan: string;
  period: "monthly" | "yearly";
  mode?: "subscription" | "lifetime";
  text?: string;
} & Partial<AppButtonProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug, plan: currentPlan } = useWorkspace();

  const plausible = usePlausible();

  const selectedPlan =
    SELF_SERVE_PAID_PLANS.find(
      (p) => p.name.toLowerCase() === plan,
    ) ?? SELF_SERVE_PAID_PLANS[0];

  const [clicked, setClicked] = useState(false);

  const queryString = searchParams.toString();
  const isCurrentPlan = currentPlan === selectedPlan.name.toLowerCase();

  const baseUrl = `${APP_DOMAIN}${pathname}${queryString.length > 0 ? `?${queryString}` : ""}`;
  const onboarding = searchParams.get("workspace");

  const handleUpgrade = async () => {
    if (mode === "lifetime" && selectedPlan.name.toLowerCase() !== "pro") {
      alert("Lifetime is only available for the Pro plan.");
      return;
    }

    setClicked(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/billing/upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
            period: mode === "lifetime" ? "lifetime" : period,
            baseUrl,
            onboarding,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create checkout session");
      }

      const data = await response.json();
      const { url } = data as { url?: string };

      if (!url) {
        throw new Error("Stripe checkout URL missing");
      }

      // Track analytics
      plausible("Opened Checkout");
      posthog.capture("checkout_opened", {
        currentPlan: capitalize(plan),
        newPlan: selectedPlan.name,
        ...(mode === "lifetime" && { period: "lifetime" }),
      });

      // Redirect based on current plan
      if (currentPlan === "free" || mode === "lifetime") {
        window.location.href = url;
      } else {
        router.push(url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setClicked(false);
    }
  };

  const getButtonText = () => {
    if (text) return text;
    if (isCurrentPlan) return "Your current plan";
    if (currentPlan === "free") {
      return `Get started with ${selectedPlan.name} ${capitalize(period)}`;
    }
    return `Switch to ${selectedPlan.name} ${capitalize(period)}`;
  };

  return (
    <AppButton
      type="button"
      className={cn("text-sm", className)}
      loading={clicked}
      disabled={!workspaceSlug}
      onClick={handleUpgrade}
      {...rest}
    >
      {getButtonText()}
    </AppButton>
  );
}
