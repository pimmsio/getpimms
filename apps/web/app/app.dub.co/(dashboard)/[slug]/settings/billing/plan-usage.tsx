"use client";

import useTagsCount from "@/lib/swr/use-tags-count";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton, AppButtonLink } from "@/ui/components/controls/app-button";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import SubscriptionMenu from "@/ui/workspaces/subscription-menu";
import { Icon, useRouterStuff } from "@dub/ui";
import { CircleDollar, CursorRays, Hyperlink } from "@dub/ui/icons";
import {
  capitalize,
  cn,
  currencyFormatter,
  getFirstAndLastDay,
  INFINITY_NUMBER,
  nFormatter,
} from "@dub/utils";
import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { CSSProperties, useMemo } from "react";
import { UsageChart } from "./usage-chart";

export default function PlanUsage() {
  const {
    slug,
    plan,
    stripeId,
    currency,
    usage,
    usageLimit,
    salesUsage,
    salesLimit,
    linksUsage,
    linksLimit,
    domains,
    domainsLimit,
    foldersUsage,
    foldersLimit,
    tagsLimit,
    usersLimit,
    billingCycleStart,
  } = useWorkspace();
  const { openUpgradeModal } = useUpgradeModal();

  const { data: tags } = useTagsCount();
  const { users } = useUsers();

  const [billingStart, billingEnd] = useMemo(() => {
    if (billingCycleStart) {
      const { firstDay, lastDay } = getFirstAndLastDay(billingCycleStart);
      const start = firstDay.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const end = lastDay.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return [start, end];
    }
    return [];
  }, [billingCycleStart]);

  return (
    <div className="rounded bg-white">
      <div className="flex flex-col items-start justify-between gap-y-4 p-6 md:p-8 lg:flex-row">
        <div>
          <h2 className="text-xl font-medium">{capitalize(plan)} Plan</h2>
          {billingStart && billingEnd && (
            <p className="mt-1.5 text-balance text-sm font-medium leading-normal text-neutral-700">
              <>
                Current billing cycle:{" "}
                <span className="font-normal">
                  {billingStart} - {billingEnd}
                </span>
              </>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <AppButton
            onClick={openUpgradeModal}
            variant="primary"
            size="sm"
          >
            Upgrade
          </AppButton>
          <AppButtonLink
            href={`/${slug}/settings/billing/invoices`}
            variant="secondary"
            size="sm"
          >
            View invoices
          </AppButtonLink>
          {stripeId && plan !== "free" && <SubscriptionMenu />}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-neutral-100">
        <div>
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-8 lg:gap-6">
            <UsageTabCard
              id="events"
              icon={CursorRays}
              title="Events tracked (clicks + conversions)"
              usage={usage}
              limit={usageLimit}
            />
            <UsageTabCard
              id="links"
              icon={Hyperlink}
              title="Links created"
              usage={linksUsage}
              limit={linksLimit}
            />
            <UsageTabCard
              id="revenue"
              icon={CircleDollar}
              title="Revenue tracked"
              usage={salesUsage}
              limit={salesLimit}
              unit={((currency || "EUR").toUpperCase() as "EUR" | "USD") ?? "EUR"}
            />
          </div>
          <div className="w-full px-2 pb-8 md:px-8">
            <UsageChart />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageTabCard({
  id,
  icon: Icon,
  title,
  usage: usageProp,
  limit: limitProp,
  unit,
}: {
  id: string;
  icon: Icon;
  title: string;
  usage?: number;
  limit?: number;
  unit?: "EUR" | "USD";
}) {
  const { searchParams, queryParams } = useRouterStuff();
  const { slug } = useWorkspace();

  const isActive =
    searchParams.get("tab") === id ||
    (!searchParams.get("tab") && id === "events");

  const [usage, limit] =
    unit && usageProp !== undefined && limitProp !== undefined
      ? [usageProp / 100, limitProp / 100]
      : [usageProp, limitProp];

  const loading = usage === undefined || limit === undefined;
  const unlimited = limit !== undefined && limit >= INFINITY_NUMBER;
  const warning = !loading && !unlimited && usage >= limit * 0.9;
  const remaining = !loading && !unlimited ? Math.max(0, limit - usage) : 0;

  return (
    <button
      className={cn(
        "rounded border border-neutral-200 bg-white px-4 py-3 text-left transition-colors duration-75",
        "outline-none focus-visible:border-blue-600 focus-visible:ring-0 focus-visible:ring-blue-600",
        isActive && "border-neutral-200 ring-1 ring-transparent",
        "hover:bg-neutral-50 lg:px-5 lg:py-4",
      )}
      aria-selected={isActive}
      onClick={() => queryParams({ set: { tab: id } })}
    >
      {/* <Icon className="size-4 text-neutral-600" /> */}
      <div className="mt-1.5 flex items-center gap-2 text-sm text-neutral-600">
        {title}
      </div>
      <div className="mt-2">
        {!loading ? (
          <NumberFlow
            value={usage}
            className="text-xl leading-none text-neutral-900"
            format={
              unit
                ? {
                    style: "currency",
                    currency: unit,
                    // @ts-ignore – trailingZeroDisplay is a valid option but TS is outdated
                    trailingZeroDisplay: "stripIfInteger",
                  }
                : {
                    notation: usage < INFINITY_NUMBER ? "standard" : "compact",
                  }
            }
          />
        ) : (
          <div className="h-5 w-16 animate-pulse rounded bg-neutral-200" />
        )}
      </div>
      <div className="mt-5">
        <div
          className={cn(
            "h-1 w-full overflow-hidden rounded-full bg-neutral-900/10 transition-colors",
            loading && "bg-neutral-900/5",
          )}
        >
          {!loading && !unlimited && (
            <div
              className="animate-slide-right-fade size-full"
              style={{ "--offset": "-100%" } as CSSProperties}
            >
              <div
                className={cn(
                  "size-full rounded-full",
                  warning ? "bg-red-500" : "bg-neutral-700/70",
                )}
                style={{
                  transform: `translateX(-${100 - Math.max(Math.floor((usage / Math.max(0, usage, limit)) * 100), usage === 0 ? 0 : 1)}%)`,
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 leading-none">
        {!loading ? (
          <span className="text-xs leading-none text-neutral-600">
            {unlimited
              ? "Unlimited"
              : unit
                ? `${currencyFormatter(remaining, {
                    currency: unit,
                    maximumFractionDigits: 0,
                  })} remaining of ${currencyFormatter(limit, {
                    currency: unit,
                    maximumFractionDigits: 0,
                  })}`
                : `${nFormatter(remaining, { full: true })} remaining of ${nFormatter(
                    limit,
                    { full: limit < INFINITY_NUMBER },
                  )}`}
          </span>
        ) : (
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
        )}
      </div>
    </button>
  );
}

function UsageCategory(data: {
  title: string;
  icon: Icon;
  usage?: number | string;
  usageLimit?: number;
  href?: string;
}) {
  const { title, icon: Icon, usage, usageLimit, href } = data;

  const As = href ? Link : "div";

  return (
    <As
      className={cn(
        "flex flex-col justify-between gap-4 bg-white p-6 md:px-8",
        href && "transition-colors hover:bg-neutral-50",
      )}
      href={href ?? "#"}
      {...(href?.startsWith("http") && { target: "_blank" })}
    >
      <div className="flex cursor-default items-center gap-2 text-neutral-800">
        <Icon className="size-4 shrink-0" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
        {usage || usage === 0 ? (
          <p>
            {typeof usage === "number"
              ? nFormatter(usage, { full: true })
              : usage}
          </p>
        ) : (
          <div className="size-5 animate-pulse rounded bg-neutral-200" />
        )}
        {usageLimit !== undefined && (
          <>
            <span>/</span>
            <p className="text-neutral-500">
              {usageLimit && usageLimit >= INFINITY_NUMBER
                ? "∞"
                : nFormatter(usageLimit, { full: true })}
            </p>
          </>
        )}
      </div>
    </As>
  );
}
