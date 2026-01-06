"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import ManageSubscriptionButton from "@/ui/workspaces/manage-subscription-button";
import { AnimatedSizeContainer, Icon } from "@dub/ui";
import { CursorRays, Hyperlink } from "@dub/ui/icons";
import {
  cn,
  currencyFormatter,
  getFirstAndLastDay,
  getNextPlan,
  INFINITY_NUMBER,
  nFormatter,
} from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CSSProperties, forwardRef, useMemo, useState } from "react";
import { ConversionsOnboarding } from "./conversions/conversions-onboarding";
import UserDropdown from "./user-dropdown";

export function Usage() {
  const { slug } = useParams() as { slug?: string };

  return slug ? <UsageInner /> : null;
}

function UsageInner() {
  const {
    usage,
    usageLimit,
    linksUsage,
    linksLimit,
    salesUsage,
    salesLimit,
    currency,
    billingCycleStart,
    plan,
    slug,
    paymentFailedAt,
    loading,
  } = useWorkspace({ swrOpts: { keepPreviousData: true } });
  const { openUpgradeModal } = useUpgradeModal();

  const [billingEnd] = useMemo(() => {
    if (billingCycleStart) {
      const { lastDay } = getFirstAndLastDay(billingCycleStart);
      const end = lastDay.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return [end];
    }
    return [];
  }, [billingCycleStart]);

  const [hovered, setHovered] = useState(false);

  const nextPlan = getNextPlan(plan);

  // Warn the user if they're >= 90% of any limit
  const warnings = useMemo(
    () =>
      [
        [usage, usageLimit],
        [linksUsage, linksLimit],
        [salesUsage, salesLimit],
      ].map(
        ([usage, limit]) =>
          usage !== undefined &&
          limit !== undefined &&
          usage / Math.max(0, usage, limit) >= 0.9,
      ),
    [usage, usageLimit, linksUsage, linksLimit, salesUsage, salesLimit],
  );

  const warning = warnings.some((w) => w);

  const [salesRef, setSalesRef] = useState<HTMLDivElement | null>(null);

  return loading || usage !== undefined ? (
    <>
      <AnimatedSizeContainer height>
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <Link
              className="group flex items-center gap-0.5 text-sm font-normal text-neutral-500 transition-colors hover:text-neutral-700"
              href={`/${slug}/settings/billing`}
            >
              Usage
              <ChevronRight className="size-3 text-neutral-400 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-neutral-500" />
            </Link>
            <div className="flex items-center gap-3">
              {/* <Suspense fallback={null}>{toolContent}</Suspense> */}
              <UserDropdown />
            </div>
          </div>

          <div className="mt-3 hidden flex-col gap-3 md:flex">
            <UsageRow
              icon={CursorRays}
              label="Events"
              usage={usage}
              limit={usageLimit}
              href={`/${slug}/conversions`}
              showNextPlan={hovered}
              nextPlanLimit={nextPlan?.limits.clicks}
              warning={warnings[0]}
            />
            <UsageRow
              icon={Hyperlink}
              label="Links"
              usage={linksUsage}
              limit={linksLimit}
              href={`/${slug}/links`}
              showNextPlan={hovered}
              nextPlanLimit={nextPlan?.limits.links}
              warning={warnings[1]}
            />
            {/* {salesLimit && salesLimit > 0 ? (
              <UsageRow
                ref={setSalesRef}
                icon={CircleDollar}
                label="Sales"
                usage={salesUsage}
                limit={salesLimit}
                showNextPlan={hovered}
                nextPlanLimit={nextPlan?.limits.sales}
                warning={warnings[2]}
              />
            ) : null} */}
          </div>

          <ConversionsOnboarding referenceElement={salesRef} />

          {paymentFailedAt && (
            <div className="mt-3">
              {loading ? (
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-500/10" />
              ) : (
                <p
                  className={cn(
                    "text-xs text-neutral-900/40",
                    paymentFailedAt && "text-red-600",
                  )}
                >
                  {paymentFailedAt
                    ? "Your last payment failed. Please update your payment method to continue using PiMMs."
                    : `Usage will reset ${billingEnd}`}
                </p>
              )}
            </div>
          )}

          {paymentFailedAt ? (
            <ManageSubscriptionButton
              text="Update Payment Method"
              variant="primary"
              className="mt-4 w-full"
              onMouseEnter={() => {
                setHovered(true);
              }}
              onMouseLeave={() => {
                setHovered(false);
              }}
            />
          ) : warning || plan === "free" ? (
            <AppButton
              onClick={openUpgradeModal}
              variant="primary"
              size="sm"
              className="mt-4 w-full"
              onMouseEnter={() => {
                setHovered(true);
              }}
              onMouseLeave={() => {
                setHovered(false);
              }}
            >
              {plan === "free" ? "Upgrade plan" : "Upgrade plan"}
            </AppButton>
          ) : null}
        </div>
      </AnimatedSizeContainer>
    </>
  ) : null;
}

type UsageRowProps = {
  icon: Icon;
  label: string;
  usage?: number;
  limit?: number;
  href?: string;
  showNextPlan: boolean;
  nextPlanLimit?: number;
  warning: boolean;
  currency?: string | null;
};

const UsageRow = forwardRef<HTMLDivElement, UsageRowProps>(
  (
    {
      icon: Icon,
      label,
      usage,
      limit,
      href,
      showNextPlan,
      nextPlanLimit,
      warning,
      currency,
    }: UsageRowProps,
    ref,
  ) => {
    const loading = usage === undefined || limit === undefined;
    const unlimited = limit !== undefined && limit >= INFINITY_NUMBER;

    const content = (
      <>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* <Icon className="size-3.5 text-neutral-600" /> */}
            <span className="text-xs font-medium text-neutral-700">
              {label}
            </span>
          </div>
          {!loading ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-neutral-600">
                <NumberFlow
                  value={label === "Sales" ? usage / 100 : usage}
                  format={
                    label === "Sales"
                      ? {
                          style: "currency",
                          currency:
                            ((currency || "EUR").toUpperCase() as "EUR" | "USD") ??
                            "EUR",
                          maximumFractionDigits: 0,
                        }
                      : undefined
                  }
                />{" "}
                of{" "}
                <motion.span
                  className={cn(
                    "relative transition-colors duration-150",
                    showNextPlan && nextPlanLimit
                      ? "text-neutral-400"
                      : "text-neutral-600",
                  )}
                >
                  {label === "Sales"
                    ? currencyFormatter(limit / 100, {
                        currency:
                          ((currency || "EUR").toUpperCase() as "EUR" | "USD") ??
                          "EUR",
                        maximumFractionDigits: 0,
                      })
                    : formatNumber(limit)}
                  {showNextPlan && nextPlanLimit && (
                    <motion.span
                      className="absolute bottom-[45%] left-0 h-[1px] bg-neutral-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: 0.25,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.span>
              </span>
              {href && (
                <ChevronRight className="size-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>
          ) : (
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-500/10" />
          )}
        </div>
        {!unlimited && (
          <div className="mt-1.5">
            <div
              className={cn(
                "h-[6px] w-full overflow-hidden rounded-full bg-neutral-900/10 transition-colors",
                loading && "bg-neutral-900/5",
              )}
            >
              {!loading && (
                <div
                  className="animate-slide-right-fade size-full"
                  style={{ "--offset": "-100%" } as CSSProperties}
                >
                  <div
                    className={cn(
                      "size-full rounded-full bg-neutral-200/40",
                      warning && "to-brand-primary",
                    )}
                    style={{
                      transform: `translateX(-${100 - Math.max(Math.floor((usage / Math.max(0, usage, limit)) * 100), usage === 0 ? 0 : 1)}%)`,
                      transition: "transform 0.25s ease-in-out",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );

    return (
      <div ref={ref}>
        {href ? (
          <Link
            href={href}
            className="group -m-2 block rounded-lg p-2 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    );
  },
);

const formatNumber = (value: number) =>
  value >= INFINITY_NUMBER
    ? "∞"
    : nFormatter(value, {
        full: value !== undefined && value < 999,
        digits: 1,
      });
