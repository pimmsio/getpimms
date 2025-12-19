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
  className,
  text,
  ...rest
}: {
  plan: string;
  period: "monthly" | "yearly";
  text?: string;
} & Partial<AppButtonProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug, plan: currentPlan } = useWorkspace();

  const plausible = usePlausible();

  const selectedPlan =
    SELF_SERVE_PAID_PLANS.find(
      (p) => p.name.toLowerCase() === plan.toLowerCase(),
    ) ?? SELF_SERVE_PAID_PLANS[0];

  const [clicked, setClicked] = useState(false);

  const queryString = searchParams.toString();

  const isCurrentPlan = currentPlan === selectedPlan.name.toLowerCase();

  return (
    <AppButton
      type="button"
      className={cn("text-sm", className)}
      loading={clicked}
      disabled={!workspaceSlug || isCurrentPlan}
      onClick={() => {
        if (selectedPlan.name === "Starter") {
          window.location.href = `/api/pay?id=5kAeWJ8Q2f0O1e8dQS`;
          return;
        }
        if (selectedPlan.name === "Pro") {
          window.location.href = `/api/pay?id=9B66oG2VvcYq3STaGmc7u07`;
          return;
        }

        setClicked(true);
        fetch(`/api/workspaces/${workspaceSlug}/billing/upgrade`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
            period,
            baseUrl: `${APP_DOMAIN}${pathname}${queryString.length > 0 ? `?${queryString}` : ""}`,
            onboarding: searchParams.get("workspace"),
          }),
        })
          .then(async (res) => {
            plausible("Opened Checkout");
            posthog.capture("checkout_opened", {
              currentPlan: capitalize(plan),
              newPlan: selectedPlan.name,
            });
            if (currentPlan === "free") {
              const data = await res.json();
              const { url } = data as { url?: string };
              if (url) {
                window.location.href = url;
              } else {
                throw new Error("Stripe checkout URL missing");
              }
            } else {
              const { url } = await res.json();
              router.push(url);
            }
          })
          .catch((err) => {
            alert(err);
          })
          .finally(() => {
            setClicked(false);
          });
      }}
      {...rest}
    >
      {text ??
        (isCurrentPlan
          ? "Your current plan"
          : currentPlan === "free"
            ? `Get started with ${selectedPlan.name} ${capitalize(period)}`
            : `Switch to ${selectedPlan.name} ${capitalize(period)}`)}
    </AppButton>
  );
}
