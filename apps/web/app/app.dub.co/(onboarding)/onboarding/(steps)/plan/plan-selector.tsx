"use client";

import { PlanFeatures } from "@/ui/workspaces/plan-features";
import { UpgradePlanButton } from "@/ui/workspaces/upgrade-plan-button";
import { Badge } from "@dub/ui";
import { cn, PRO_PLAN, STARTER_PLAN } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CSSProperties, useState } from "react";
import { LaterButton } from "../../later-button";

const plans = [STARTER_PLAN, PRO_PLAN /*, ADVANCED_PLAN*/];

export function PlanSelector() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const [mobilePlanIndex, setMobilePlanIndex] = useState(0);

  return (
    <div className="flex flex-col gap-y-8">
      <LaterButton
        next="support"
        className="font-bold underline-offset-4 hover:underline"
      >
        Skip this step, Start for free
      </LaterButton>
      {/* <div className="flex justify-center">
        <ToggleGroup
          options={[
            { value: "monthly", label: "Pay monthly" },
            {
              value: "yearly",
              label: "Pay yearly",
              badge: <Badge variant="blue">Save 20%</Badge>,
            },
          ]}
          className="border-none"
          optionClassName="normal-case"
          indicatorClassName="border-none bg-neutral-200/70"
          selected={period}
          selectAction={(period) => setPeriod(period as "monthly" | "yearly")}
        />
      </div> */}
      <div className="overflow-hidden [container-type:inline-size]">
        <div
          className={cn(
            "grid grid-cols-3 gap-x-4 lg:grid-cols-2",

            // Mobile
            "max-lg:w-[calc(300cqw+2*32px)] max-lg:translate-x-[calc(-1*var(--index)*(100cqw+32px))] max-lg:gap-x-8 max-lg:transition-transform",
          )}
          style={
            {
              "--index": mobilePlanIndex,
            } as CSSProperties
          }
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded border border-neutral-100 bg-white p-6 pb-8"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-neutral-800">
                  {plan.name}
                </h2>
                {plan.name === "Pro" && (
                  <Badge variant="blue">Most popular</Badge>
                )}
              </div>
              <div className="mt-1 text-base font-medium text-neutral-400">
                <NumberFlow
                  value={
                    plan.name === "Pro" || plan.name === "Starter"
                      ? plan.price["lifetime"]!
                      : plan.price[period]!
                  }
                  className="tabular-nums text-neutral-700"
                  format={{
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }}
                  continuous
                />
                {plan.name === "Starter" || plan.name === "Pro" ? (
                  <span className="ml-1 font-medium">One-time payment</span>
                ) : (
                  <span className="ml-1 font-medium">Contact Sales</span>
                )}
              </div>
              <div className="my-6 flex gap-2">
                <button
                  type="button"
                  className="h-full w-fit rounded bg-neutral-100 px-2.5 transition-colors duration-75 hover:bg-neutral-200/80 enabled:active:bg-neutral-200 disabled:opacity-30 lg:hidden"
                  disabled={mobilePlanIndex === 0}
                  onClick={() => setMobilePlanIndex(mobilePlanIndex - 1)}
                >
                  <ChevronLeft className="size-5 text-neutral-800" />
                </button>
                <UpgradePlanButton
                  plan={plan.name.toLowerCase()}
                  period={period}
                  text="Unlock lifetime access"
                  className="h-10 rounded shadow-sm"
                />
                <button
                  type="button"
                  className="h-full w-fit rounded bg-neutral-100 px-2.5 transition-colors duration-75 hover:bg-neutral-200/80 active:bg-neutral-200 disabled:opacity-30 lg:hidden"
                  disabled={mobilePlanIndex >= plans.length - 1}
                  onClick={() => setMobilePlanIndex(mobilePlanIndex + 1)}
                >
                  <ChevronRight className="size-5 text-neutral-800" />
                </button>
              </div>
              <PlanFeatures className="mt-2" plan={plan.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
