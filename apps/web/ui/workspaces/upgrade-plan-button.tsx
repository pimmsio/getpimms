"use client";

import { getStripe } from "@/lib/stripe/client";
import useWorkspace from "@/lib/swr/use-workspace";
import { Button, ButtonProps } from "@dub/ui";
import { APP_DOMAIN, capitalize, cn, type EventsLimit } from "@dub/utils";
import { usePlausible } from "next-plausible";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";

export function UpgradePlanButton({
  eventsLimit,
  period,
  variant = "default",
  className,
  ...rest
}: {
  eventsLimit: EventsLimit;
  period: "monthly" | "yearly" | "lifetime";
  variant?: "default" | "white";
} & Partial<ButtonProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug, plan: currentPlan } = useWorkspace();

  const plausible = usePlausible();

  const [clicked, setClicked] = useState(false);

  const queryString = searchParams.toString();

  const isCurrentPlan = currentPlan === "pro";

  return (
    <Button
      variant="secondary"
      text={
        isCurrentPlan
          ? "Your current plan"
          : rest.text || (currentPlan === "free"
            ? `Get started with Pro ${capitalize(period)}`
            : `Switch to Pro ${capitalize(period)}`)
      }
      className={cn(
        "text-sm rounded-2xl transition-all duration-300",
        variant === "white" 
          ? "bg-white text-gray-900 hover:bg-gray-100" 
          : "text-white bg-gradient-to-r from-[#2fcdfa] to-[#3970ff] hover:scale-105",
        className
      )}
      loading={clicked}
      disabled={!workspaceSlug || isCurrentPlan}
      onClick={() => {
        setClicked(true);
        fetch(`/api/workspaces/${workspaceSlug}/billing/upgrade`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: "pro",
            eventsLimit: eventsLimit,
            period,
            baseUrl: `${APP_DOMAIN}${pathname}${queryString.length > 0 ? `?${queryString}` : ""}`,
            onboarding: searchParams.get("workspace"),
          }),
        })
          .then(async (res) => {
            plausible("Opened Checkout");
            posthog.capture("checkout_opened", {
              currentPlan: currentPlan,
              newPlan: "pro",
              eventsLimit: eventsLimit,
              period: period,
            });
            if (currentPlan === "free") {
              const data = await res.json();
              const { id: sessionId } = data;
              const stripe = await getStripe();
              stripe?.redirectToCheckout({ sessionId });
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
    />
  );
}
