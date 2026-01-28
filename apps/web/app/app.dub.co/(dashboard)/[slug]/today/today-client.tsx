"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { SingleFlameIcon } from "@/ui/analytics/events/hot-score-icons";
import { AppButtonLink } from "@/ui/components/controls/app-button";
import { useLinkBuilder } from "@/ui/modals/link-builder";
import { ModalContext } from "@/ui/modals/modal-provider";
import { GettingStartedPanel } from "@/ui/onboarding/getting-started-panel";
import { HelpTooltip, Table, useTable } from "@dub/ui";
import { LoadingSpinner } from "@dub/ui/icons";
import {
  COUNTRIES,
  cn,
  currencyFormatter,
  fetcher,
  formatDate,
  formatDateTimeSmart,
  timeAgo,
} from "@dub/utils";
import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useContext, useMemo } from "react";
import useSWR from "swr";

type AnalyticsCount = {
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number; // cents
};

type DeviceBreakdownRow = {
  device: string;
  clicks?: number;
};

type ClickFeedResponse = {
  hasRealData: boolean;
  items: Array<{
    timestamp: string;
    clickId: string;
    linkId: string;
    domain: string;
    key: string;
    device?: string | null;
    referer?: string | null;
    identityHash?: string | null;
    customer: { id: string; name: string | null; email: string | null } | null;
  }>;
};

type ClickRow = ClickFeedResponse["items"][number];

type LeadRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  hotScore?: number | null;
  lastEventAt?: string | null;
  lastActivityType?: "click" | "lead" | "sale" | null;
  totalClicks?: number | null;
  createdAt?: string | null;
  country?: string | null;
  __masked?: boolean;
};

type LeadSignalRow = ClickRow | LeadRow;

// TODO: re-enable video section once content is ready.
const featuredVideo = {
  title: "Deep links on Pimms (opens the official app)",
  href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  thumbnail: "https://assets.pimms.io/blog/new-link-builder.jpg",
  description:
    "1 minute. See how Pimms links open YouTube/Instagram in the official app on mobile.",
} as const;

// TODO: re-enable onboarding section once videos are ready.
// const onboardingVideos = [
//   {
//     title: "Why UTM are important to segment your traffic and get insights",
//     href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
//     thumbnail: "https://assets.pimms.io/blog/new-link-builder.jpg",
//   },
//   {
//     title: "How to get started with conversion tracking",
//     href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
//     thumbnail: "https://assets.pimms.io/conversion-tracking-1.png",
//   },
//   {
//     title: "How to track Stripe sales (integration)",
//     href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
//     thumbnail: "https://assets.pimms.io/stripe-guide-pimms.webp",
//   },
// ] as const;

function firstNameFromDisplayName(name?: string | null) {
  if (!name) return "there";
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

export default function TodayClient() {
  const { slug, id: workspaceId } = useWorkspace();
  const { data: session } = useSession();
  const firstName = firstNameFromDisplayName(session?.user?.name);

  const { LinkBuilder, CreateLinkButton } = useLinkBuilder();

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const todayQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      groupBy: "count",
      event: "composite",
      interval: "24h",
      timezone,
    });
    return `/api/analytics?${qs.toString()}`;
  }, [workspaceId, timezone]);

  const last7dQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      groupBy: "count",
      event: "composite",
      interval: "7d",
      timezone,
    });
    return `/api/analytics?${qs.toString()}`;
  }, [workspaceId, timezone]);

  const last7dDevicesQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      groupBy: "devices",
      event: "composite",
      interval: "7d",
      timezone,
    });
    return `/api/analytics?${qs.toString()}`;
  }, [workspaceId, timezone]);

  const last30dQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      groupBy: "count",
      event: "composite",
      interval: "30d",
      timezone,
    });
    return `/api/analytics?${qs.toString()}`;
  }, [workspaceId, timezone]);

  const {
    data: todayAnalytics,
    isLoading: todayLoading,
    error: todayError,
  } = useSWR<AnalyticsCount>(todayQuery, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const {
    data: last7dAnalytics,
    isLoading: last7dLoading,
    error: last7dError,
  } = useSWR<AnalyticsCount>(last7dQuery, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const { data: last7dDevices } = useSWR<DeviceBreakdownRow[]>(
    last7dDevicesQuery,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const {
    data: last30dAnalytics,
    isLoading: last30dLoading,
    error: last30dError,
  } = useSWR<AnalyticsCount>(last30dQuery, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const todaySaleAmount = todayAnalytics?.saleAmount ?? 0;
  const todayRevenue = todaySaleAmount / 100;
  const todayClicks = todayAnalytics?.clicks ?? 0;
  const todayLeads = todayAnalytics?.leads ?? 0;
  const todayCvr = todayClicks > 0 ? (todayLeads / todayClicks) * 100 : 0;

  const last7dSaleAmount = last7dAnalytics?.saleAmount ?? 0;
  const last7dRevenue = last7dSaleAmount / 100;
  const last7dClicks = last7dAnalytics?.clicks ?? 0;
  const last7dLeads = last7dAnalytics?.leads ?? 0;
  const last7dSales = last7dAnalytics?.sales ?? 0;
  const last7dSignals = last7dLeads + last7dSales;
  const last7dCvr = last7dClicks > 0 ? (last7dLeads / last7dClicks) * 100 : 0;

  const last30dSaleAmount = last30dAnalytics?.saleAmount ?? 0;
  const last30dRevenue = last30dSaleAmount / 100;
  const last30dClicks = last30dAnalytics?.clicks ?? 0;
  const last30dLeads = last30dAnalytics?.leads ?? 0;
  const last30dCvr =
    last30dClicks > 0 ? (last30dLeads / last30dClicks) * 100 : 0;

  const clicksSaved7d =
    last7dDevices?.reduce((sum, d) => {
      if (d.device === "Mobile" || d.device === "Tablet") {
        return sum + (d.clicks || 0);
      }
      return sum;
    }, 0) ?? 0;

  return (
    <>
      <LinkBuilder />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-600">
            Welcome {firstName}
          </div>
          <div className="mt-0.5 text-xl font-semibold text-neutral-900">
            Here's what's happening today
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateLinkButton />
          <AppButtonLink href={`/${slug}/links`} variant="secondary" size="md">
            View links
          </AppButtonLink>
          <AppButtonLink
            href="https://pim.ms/dAXN6jl"
            target="_blank"
            variant="secondary"
            size="md"
          >
            Book a demo call
          </AppButtonLink>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-5 border-t border-neutral-100 pt-5">
        {/* Getting started + onboarding videos */}
        <div className="mb-6">
          <GettingStartedPanel />
        </div>

        {/* Deep links video */}
        {/* <div className="mb-6">
          <a
            href={featuredVideo.href}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <div className="relative aspect-[16/6] w-full bg-neutral-100">
              <BlurImage
                src={featuredVideo.thumbnail}
                alt=""
                className="h-full w-full object-cover"
                width={1200}
                height={450}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <PlayCircle className="size-6 text-white" />
                <div className="text-sm font-semibold text-white">
                  {featuredVideo.title}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-neutral-900">
                  {featuredVideo.description}
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  Watch → then create your first “opens the official app” link
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-neutral-300 group-hover:text-neutral-500" />
            </div>
          </a>
        </div> */}

        {/* Metrics */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900">
              Metrics
            </div>
            <AppButtonLink
              href={`/${slug}/analytics`}
              variant="secondary"
              size="sm"
            >
              Analytics
              <ChevronRight className="ml-1 size-3 text-neutral-500" />
            </AppButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <IntervalMetrics
              label="Today"
              loading={todayLoading}
              error={Boolean(todayError)}
              clicks={todayClicks}
              leads={todayLeads}
              revenue={todayRevenue}
              cvr={todayCvr}
            />
            <IntervalMetrics
              label="7d"
              loading={last7dLoading}
              error={Boolean(last7dError)}
              clicks={last7dClicks}
              leads={last7dLeads}
              revenue={last7dRevenue}
              cvr={last7dCvr}
            />
            <IntervalMetrics
              label="30d"
              loading={last30dLoading}
              error={Boolean(last30dError)}
              clicks={last30dClicks}
              leads={last30dLeads}
              revenue={last30dRevenue}
              cvr={last30dCvr}
            />
          </div>

          <div className="mt-3 rounded-lg bg-neutral-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                Clicks saved last week
              </div>
              <div className="text-lg font-semibold text-neutral-900 tabular-nums">
                {clicksSaved7d.toLocaleString()}
              </div>
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Your links open the official apps on mobile instead of in-app
              browsers.
            </div>
          </div>
        </div>

        {/* Lead Signal Activity */}
        <div className="mb-6 border-t border-neutral-100 pt-5">
          <LeadSignalActivitySection slug={slug} />
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  formattedValue,
  prefix,
  decimals,
}: {
  label: string;
  value: number;
  formattedValue?: string;
  prefix?: string;
  decimals?: number;
}) {
  const formatted =
    formattedValue ??
    (decimals !== undefined
      ? value.toFixed(decimals)
      : Math.round(value).toString());
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <div className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-neutral-900 tabular-nums">
        {formatted}
      </div>
    </div>
  );
}

function LeadSignalActivitySection({ slug }: { slug?: string }) {
  const { id: workspaceId } = useWorkspace();
  const { setShowConversionOnboardingModal } = useContext(ModalContext);

  const leadsFeedQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      interval: "7d",
      limit: "5",
      page: "1",
    });
    return `/api/customers/leads-feed?${qs.toString()}`;
  }, [workspaceId]);

  const { data: leadsData, isLoading } = useSWR<any>(leadsFeedQuery, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const leads = (leadsData?.customers?.slice(0, 5) || []) as LeadRow[];

  const clickFeedQuery = useMemo(() => {
    if (!workspaceId) return null;
    const qs = new URLSearchParams({
      workspaceId,
      limit: "5",
    });
    return `/api/click-feed?${qs.toString()}`;
  }, [workspaceId]);

  const shouldFetchClicks = !isLoading && leads.length === 0;
  const { data: clickFeedData, isLoading: clickFeedLoading } =
    useSWR<ClickFeedResponse>(
      shouldFetchClicks ? clickFeedQuery : null,
      fetcher,
      {
        keepPreviousData: true,
        revalidateOnFocus: false,
      },
    );

  const clicksLast7d = useMemo(() => {
    const items = clickFeedData?.items ?? [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return items
      .filter((it) => new Date(it.timestamp).getTime() >= sevenDaysAgo)
      .slice(0, 5);
  }, [clickFeedData?.items]);

  const maskedLeads = useMemo(() => {
    return Array.from({ length: 1 }).map((_, i) => ({
      id: `masked_${i}`,
      name: `Anonymous`,
      email: `hidden${i}@example.com`,
      hotScore: 0,
      lastEventAt: new Date().toISOString(),
      lastActivityType: "click" as const,
      totalClicks: null,
      createdAt: null,
      country: null,
      __masked: true as const,
    }));
  }, []);

  const hasLeads = leads.length > 0;
  const showClicksFallback =
    !isLoading && !clickFeedLoading && !hasLeads && clicksLast7d.length > 0;
  const showDemoFallback =
    !isLoading && !hasLeads && (!clickFeedData || clicksLast7d.length === 0);

  const displayLeads = showDemoFallback ? maskedLeads : leads;

  const isPreview = showDemoFallback;

  const columns = useMemo(() => {
    if (showClicksFallback) {
      return [
        {
          id: "activity",
          header: "Recent clicks",
          cell: ({ row }: { row: any }) => {
            const it = row.original as ClickRow;
            const who =
              it.customer?.name || it.customer?.email || "Anonymous visitor";
            const when = it.timestamp
              ? timeAgo(new Date(it.timestamp), { withAgo: true })
              : "-";
            const referer = it.referer;
            return (
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex shrink-0 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    Click
                  </span>
                  <div className="min-w-0 truncate text-sm font-medium text-neutral-900">
                    {who}
                  </div>
                  <div className="shrink-0 text-xs text-neutral-500">
                    {when}
                  </div>
                </div>
                <div className="min-w-0 truncate text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">
                    {it.domain}/{it.key}
                  </span>
                  {referer ? (
                    <>
                      <span className="px-1 text-neutral-300">•</span>
                      <span className="truncate">{referer}</span>
                    </>
                  ) : null}
                </div>
              </div>
            );
          },
        },
      ];
    }

    if (isPreview) {
      return [
        {
          id: "customer",
          header: "Contact",
          cell: ({ row }: { row: any }) => {
            const lead = row.original as {
              email?: string | null;
            };
            const email = (lead.email || "hidden@example.com").toLowerCase();
            const [localPart, domainPart] = email.split("@");
            const localMasked = (localPart || "hidden")
              .slice(0, 1)
              .padEnd(Math.min((localPart || "hidden").length, 6), "•");
            const domainMasked = (domainPart || "example.com")
              .split(".")
              .map((p) => p.slice(0, 1).padEnd(Math.min(p.length, 6), "•"))
              .join(".");

            return (
              <div className="group flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">
                    Anonymous
                  </div>
                  <div className="mt-0.5 truncate text-xs text-neutral-500">
                    <span className="blur-sm">{localMasked}</span>
                    <span className="px-0.5">@</span>
                    <span className="blur-sm">{domainMasked}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConversionOnboardingModal(true)}
                  className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-800"
                >
                  Reveal
                </button>
              </div>
            );
          },
        },
        {
          id: "lastActivityAt",
          header: "Last activity",
          size: 140,
          cell: () => (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                  Click
                </span>
              </div>
            </div>
          ),
        },
      ];
    }

    return [
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }: { row: any }) => {
          const lead = row.original as {
            id: string;
            name?: string | null;
            email?: string | null;
            lastEventAt?: string | null;
            hotScore?: number | null;
            country?: string | null;
          };
          const email = lead.email;
          const lastActivity = lead.lastEventAt
            ? timeAgo(new Date(lead.lastEventAt), { withAgo: true })
            : "-";
          const score = lead.hotScore || 0;
          const country = lead.country;

          return (
            <Link
              href={`/${slug}/customers/${lead.id}`}
              className="group flex items-center gap-3"
            >
              <div className="flex shrink-0 items-center gap-2">
                <SingleFlameIcon className="h-5 w-5" score={score} />
                <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                  {score}
                </span>
              </div>
              <div className="h-6 w-px shrink-0 bg-neutral-200" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium text-neutral-900 group-hover:text-blue-600">
                    {lead.name || "Anonymous"}
                  </div>
                  {country && country !== "Unknown" && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <img
                        alt={country}
                        src={`https://hatscripts.github.io/circle-flags/flags/${country.toLowerCase()}.svg`}
                        className="size-3.5 shrink-0"
                      />
                      <span className="text-xs text-neutral-500">
                        {COUNTRIES[country] ?? country}
                      </span>
                    </div>
                  )}
                </div>
                {email && lead.name && (
                  <div
                    className="truncate text-xs text-neutral-500"
                    title={email}
                  >
                    {email}
                  </div>
                )}
                {!email && (
                  <div className="text-xs text-neutral-500">{lastActivity}</div>
                )}
              </div>
            </Link>
          );
        },
      },
      {
        id: "touchpoints",
        header: "Touchpoints",
        cell: ({ row }: { row: any }) => {
          const lead = row.original as {
            id: string;
            totalClicks?: number | null;
          };
          const touchpoints = lead.totalClicks;
          const customerId = lead.id;

          if (touchpoints === undefined || touchpoints === null) {
            return <span className="text-neutral-400">-</span>;
          }

          return (
            <div className="flex items-center justify-end gap-2">
              <div className="text-xs font-medium text-neutral-700">
                {touchpoints}
              </div>
              {customerId && (
                <Link
                  href={`/${slug}/customers/${customerId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-blue-600 transition-transform group-hover:translate-x-1"
                >
                  <span>See timeline</span>
                  <ChevronRight className="size-3" />
                </Link>
              )}
            </div>
          );
        },
      },
      {
        id: "lastActivityAt",
        header: "Last activity",
        minSize: 140,
        size: 160,
        maxSize: 200,
        cell: ({ row }: { row: any }) => {
          const lead = row.original as {
            lastEventAt?: string | null;
            lastActivityType?: "click" | "lead" | "sale" | null;
          };
          const ts = lead.lastEventAt;
          const kind = lead.lastActivityType;

          const label =
            kind === "click"
              ? "Click"
              : kind === "lead"
                ? "Opt-in"
                : kind === "sale"
                  ? "Sale"
                  : null;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {label ? (
                  <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    {label}
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-neutral-500">
                {ts ? formatDateTimeSmart(ts) : "-"}
              </div>
            </div>
          );
        },
      },
      {
        id: "created",
        header: "Created",
        minSize: 80,
        size: 80,
        maxSize: 100,
        cell: ({ row }: { row: any }) => {
          const lead = row.original as { createdAt?: string | null };
          const createdAt = lead.createdAt;
          if (!createdAt) {
            return <span className="text-xs text-neutral-400">-</span>;
          }
          return (
            <div className="text-xs text-neutral-700">
              {formatDate(createdAt, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          );
        },
      },
    ];
  }, [isPreview, showClicksFallback, slug, setShowConversionOnboardingModal]);

  const { table, ...tableProps } = useTable<LeadSignalRow>({
    data: showClicksFallback ? clicksLast7d : displayLeads,
    columns,
  });

  if (!slug) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          Lead Signal
          <HelpTooltip content="Last 7 days (default)." />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            onClick={() => {
              setShowConversionOnboardingModal(true);
            }}
          >
            {hasLeads ? "Setup guides" : "Reveal leads"}
          </button>
          <AppButtonLink
            href={`/${slug}/conversions?interval=7d`}
            variant="secondary"
            size="sm"
          >
            View all
            <ChevronRight className="ml-1 size-3 text-neutral-500" />
          </AppButtonLink>
        </div>
      </div>

      {showClicksFallback ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-neutral-900">
              No leads yet — but you’re getting clicks
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Showing your most recent clicks from the last 7 days (up to 5).
            </div>
          </div>
        </div>
      ) : showDemoFallback ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mt-1 text-sm text-neutral-600">
              Demo data below. Complete setup to see real activity and
              identities.
            </div>
          </div>
        </div>
      ) : null}

      {isLoading && leads.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg bg-neutral-50 py-6">
          <LoadingSpinner />
        </div>
      ) : clickFeedLoading && leads.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg bg-neutral-50 py-6">
          <LoadingSpinner />
        </div>
      ) : (
        <div className={cn(showDemoFallback ? "opacity-80" : undefined)}>
          <Table {...tableProps} table={table} />
        </div>
      )}
    </div>
  );
}

function IntervalMetrics({
  label,
  loading,
  error,
  clicks,
  leads,
  revenue,
  cvr,
}: {
  label: string;
  loading: boolean;
  error: boolean;
  clicks: number;
  leads: number;
  revenue: number;
  cvr: number;
}) {
  const { currency } = useWorkspace();
  return (
    <div className="rounded-lg bg-neutral-50 p-3">
      <div className="mb-2 text-xs font-semibold text-neutral-700">{label}</div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="py-6 text-center text-sm text-neutral-600">—</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Clicks" value={clicks} />
          <Metric label="Leads" value={leads} />
          <Metric
            label="Revenue"
            value={revenue}
            formattedValue={currencyFormatter(revenue, {
              currency: (currency || "EUR").toUpperCase() as "EUR" | "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
        </div>
      )}
    </div>
  );
}
