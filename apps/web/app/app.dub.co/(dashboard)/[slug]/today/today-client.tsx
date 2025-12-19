"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { SingleFlameIcon } from "@/ui/analytics/events/hot-score-icons";
import { AppButtonLink } from "@/ui/components/controls/app-button";
import { AnonymousVisitorsTeaser } from "@/ui/conversions/anonymous-visitors-teaser";
import { useLinkBuilder } from "@/ui/modals/link-builder";
import { BlurImage, InfoTooltip, Table, useTable } from "@dub/ui";
import { LoadingSpinner } from "@dub/ui/icons";
import {
  COUNTRIES,
  fetcher,
  formatDate,
  formatDateTimeSmart,
  timeAgo,
} from "@dub/utils";
import { BookOpen, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo } from "react";
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


type GuidesApiResponse =
  | {
      ok: true;
      guides: Array<{
        title: string;
        href: string;
        date?: string | null;
        thumbnail?: string | null;
      }>;
    }
  | { ok: false; error: string; guides: [] };

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

  const { data: guidesResponse, isLoading: guidesLoading } =
    useSWR<GuidesApiResponse>("/api/pimms/guides", fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  const guides = guidesResponse?.ok ? guidesResponse.guides : [];

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
            </AppButtonLink>
          </div>

          <div className="mb-3 rounded-lg bg-neutral-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                Clicks saved
                <InfoTooltip content="Mobile + tablet clicks (7d). Deeplinks help open the official app on mobile." />
              </div>
              <div className="text-lg font-semibold text-neutral-900 tabular-nums">
                {clicksSaved7d.toLocaleString()}
              </div>
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Use our deeplinks that open the official apps on mobile to save
              clicks from in-app browser chaos.
            </div>
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
        </div>

        {/* Lead Signal Activity */}
        <div className="border-t border-neutral-100 pt-5">
          <LeadSignalActivitySection slug={slug} />
        </div>

        {/* Latest guides */}
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900">
              Latest guides
            </div>
            <AppButtonLink
              href="https://pimms.io/guides"
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              size="sm"
            >
              View all
            </AppButtonLink>
          </div>

          {guidesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : guidesResponse && !guidesResponse.ok ? (
            <div className="py-6 text-sm text-neutral-600">
              Failed to load guides.
            </div>
          ) : guides.length === 0 ? (
            <div className="py-6 text-sm text-neutral-600">
              No guides found.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 rounded-lg bg-neutral-50/50 p-1">
              {guides.slice(0, 12).map((g) => (
                <a
                  key={g.href}
                  href={g.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-white"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {g.thumbnail ? (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <BlurImage
                          src={g.thumbnail}
                          alt=""
                          className="size-full object-cover"
                          width={240}
                          height={126}
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <BookOpen className="size-4 text-neutral-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-900">
                        {g.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-neutral-500">
                        Guides
                        {g.date ? ` · ${g.date}` : ""}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-neutral-300 group-hover:text-neutral-500" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  prefix,
  decimals,
}: {
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  const formatted =
    decimals !== undefined
      ? value.toFixed(decimals)
      : Math.round(value).toString();
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2">
      <div className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-neutral-900 tabular-nums">
        {prefix}
        {formatted}
      </div>
    </div>
  );
}

function LeadSignalActivitySection({ slug }: { slug?: string }) {
  const { id: workspaceId } = useWorkspace();

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

  const leads = (leadsData?.customers?.slice(0, 5) || []) as Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    hotScore?: number | null;
    lastEventAt?: string | null;
    lastActivityType?: "click" | "lead" | "sale" | null;
    totalClicks?: number | null;
    createdAt?: string | null;
    country?: string | null;
  }>;

  const columns = useMemo(
    () => [
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
          const display = lead.name || lead.email || "Anonymous";
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
    ],
    [slug],
  );

  const { table, ...tableProps } = useTable({
    data: leads,
    columns,
  });

  if (!slug) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">
          Latest leads
        </div>
        <AppButtonLink
          href={`/${slug}/conversions?interval=7d`}
          variant="secondary"
          size="sm"
        >
          View all
          <ChevronRight className="ml-1 size-3 text-neutral-500" />
        </AppButtonLink>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg bg-neutral-50 py-6">
          <LoadingSpinner />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg bg-neutral-50/50 p-4">
          <p className="text-sm font-semibold text-neutral-900">No leads yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Without conversion tracking, visitors stay anonymous. Set it up to
            turn clicks into leads and sales.
          </p>
          <AppButtonLink
            href={`/${slug}/conversions?ctSetup=1`}
            variant="primary"
            size="sm"
            className="mt-3 w-fit"
          >
            Reveal leads
          </AppButtonLink>
          <AnonymousVisitorsTeaser variant="plain" className="mt-3" />
        </div>
      ) : (
        <Table {...tableProps} table={table} />
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
          <Metric label="Revenue" value={revenue} prefix="$" decimals={2} />
        </div>
      )}
    </div>
  );
}
