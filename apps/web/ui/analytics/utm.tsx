import useWorkspace from "@/lib/swr/use-workspace";
import { useRouterStuff, ToggleGroup, UTM_PARAMETERS } from "@dub/ui";
import { TrendingUp } from "lucide-react";
import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { useMemo, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { useAnalyticsFilterOption } from "./utils";
import { MetricsDisplay } from "./metrics-display";
import { useAnalyticsState, useAnalyticsDashboard } from "./hooks";
import { getMetricValue, sortByMetric, RANK_COLORS } from "./lib";

type UTMBreakdownMode = "campaign" | "source" | "medium";
type UtmTuple = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

export default function UTM({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams } = useRouterStuff();
  const { slug } = useWorkspace();
  const { dashboardProps } = useAnalyticsDashboard();
  const { selectedTab } = useAnalyticsState();
  const [breakdownMode, setBreakdownMode] =
    useState<UTMBreakdownMode>("campaign");

  // UTM analytics should respect the currently applied filters.
  // (We only exclude "self" for dropdown option lists in the filter bar, not for the card itself.)
  const { data: combinationsData } = useAnalyticsFilterOption(
    { groupBy: "utm_combinations" as any },
  );

  const { data: sourcesData } = useAnalyticsFilterOption(
    { groupBy: "utm_sources" },
    { cacheOnly: breakdownMode !== "source" },
  );
  const { data: mediumsData } = useAnalyticsFilterOption(
    { groupBy: "utm_mediums" },
    { cacheOnly: breakdownMode !== "medium" },
  );
  const { data: campaignsData } = useAnalyticsFilterOption(
    { groupBy: "utm_campaigns" },
    { cacheOnly: breakdownMode !== "campaign" },
  );

  const utmCombinations = useMemo(() => {
    if (!combinationsData || combinationsData.length === 0) return null;

    const combinations = (combinationsData as any[]).map((row) => {
      const tuple = {
        utm_source: row.utm_source ?? null,
        utm_medium: row.utm_medium ?? null,
        utm_campaign: row.utm_campaign ?? null,
        utm_term: row.utm_term ?? null,
        utm_content: row.utm_content ?? null,
      } as UtmTuple;

      const params: Record<string, string> = {};
      if (row.utm_source) params.utm_source = row.utm_source;
      if (row.utm_medium) params.utm_medium = row.utm_medium;
      if (row.utm_campaign) params.utm_campaign = row.utm_campaign;
      if (row.utm_term) params.utm_term = row.utm_term;
      if (row.utm_content) params.utm_content = row.utm_content;

      return {
        tuple,
        params,
        clicks: row.clicks || 0,
        leads: row.leads || 0,
        sales: row.sales || 0,
        saleAmount: row.saleAmount || 0,
      };
    });

    // Primary sort: user-selected metric (saleAmount for sales tab)
    // Secondary: completeness (more UTM fields filled)
    // Tertiary: specificity (prefer source>medium>campaign>term>content when completeness ties)
    // Tertiary: stable tuple ordering
    const metricSorted = sortByMetric(
      combinations,
      selectedTab as "clicks" | "leads" | "sales",
    );

    return metricSorted.sort((a, b) => {
      const present = (v: unknown) => v !== null && v !== undefined && v !== "";

      const aCompleteness =
        (present(a.tuple.utm_source) ? 1 : 0) +
        (present(a.tuple.utm_medium) ? 1 : 0) +
        (present(a.tuple.utm_campaign) ? 1 : 0) +
        (present(a.tuple.utm_term) ? 1 : 0) +
        (present(a.tuple.utm_content) ? 1 : 0);
      const bCompleteness =
        (present(b.tuple.utm_source) ? 1 : 0) +
        (present(b.tuple.utm_medium) ? 1 : 0) +
        (present(b.tuple.utm_campaign) ? 1 : 0) +
        (present(b.tuple.utm_term) ? 1 : 0) +
        (present(b.tuple.utm_content) ? 1 : 0);
      if (bCompleteness !== aCompleteness) return bCompleteness - aCompleteness;

      const aSpecificity =
        (present(a.tuple.utm_source) ? 16 : 0) +
        (present(a.tuple.utm_medium) ? 8 : 0) +
        (present(a.tuple.utm_campaign) ? 4 : 0) +
        (present(a.tuple.utm_term) ? 2 : 0) +
        (present(a.tuple.utm_content) ? 1 : 0);
      const bSpecificity =
        (present(b.tuple.utm_source) ? 16 : 0) +
        (present(b.tuple.utm_medium) ? 8 : 0) +
        (present(b.tuple.utm_campaign) ? 4 : 0) +
        (present(b.tuple.utm_term) ? 2 : 0) +
        (present(b.tuple.utm_content) ? 1 : 0);
      if (bSpecificity !== aSpecificity) return bSpecificity - aSpecificity;

      const tuple = (item: any) =>
        [
          item.tuple.utm_source ?? "",
          item.tuple.utm_medium ?? "",
          item.tuple.utm_campaign ?? "",
          item.tuple.utm_term ?? "",
          item.tuple.utm_content ?? "",
        ].join("\u0000");

      return tuple(a).localeCompare(tuple(b));
    });
  }, [combinationsData, selectedTab]);

  const breakdownData =
    breakdownMode === "source"
      ? sourcesData
      : breakdownMode === "medium"
        ? mediumsData
        : campaignsData;

  const sortedBreakdown = useMemo(() => {
    if (!breakdownData || breakdownData.length === 0) return null;
    return sortByMetric(breakdownData as any[], selectedTab as any);
  }, [breakdownData, selectedTab]);

  const hasAnyData =
    (utmCombinations && utmCombinations.length > 0) ||
    (sortedBreakdown && sortedBreakdown.length > 0);

  return (
    <AnalyticsCard
      tabs={[
        { id: "utms", label: "UTM", icon: TrendingUp },
      ]}
      selectedTabId="utms"
      onSelectTab={() => {}}
      expandLimit={5}
      className="h-auto"
      dragHandleProps={dragHandleProps}
    >
      {({ limit, setShowModal, isModal, modalSection }) => {
        // Modal content shows either combinations or the breakdown list.
        if (isModal) {
          if (modalSection === "breakdown") {
            return (
              <div className="px-5 py-4">
                <BreakdownColumn
                  mode={breakdownMode}
                  setMode={setBreakdownMode}
                  data={sortedBreakdown}
                  selectedTab={selectedTab}
                  queryParams={queryParams}
                  limit={undefined}
                />
              </div>
            );
          }

          return (
            <div className="px-5 py-4">
              <CombinationsColumn
                data={utmCombinations}
                selectedTab={selectedTab}
                queryParams={queryParams}
                limit={undefined}
              />
            </div>
          );
        }

        if (!hasAnyData) {
          return <UTMEmptyState slug={slug} dashboardProps={dashboardProps} />;
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 border-b border-neutral-100 lg:border-b-0 lg:border-r lg:border-neutral-100">
              <CombinationsColumn
                data={utmCombinations}
                selectedTab={selectedTab}
                queryParams={queryParams}
                limit={limit ?? 5}
              />
              {(utmCombinations?.length ?? 0) > (limit ?? 5) && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setShowModal(true, "combos")}
                    className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                  >
                    View all {utmCombinations?.length} combinations →
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <BreakdownColumn
                mode={breakdownMode}
                setMode={setBreakdownMode}
                data={sortedBreakdown}
                selectedTab={selectedTab}
                queryParams={queryParams}
                limit={6}
              />
              {(sortedBreakdown?.length ?? 0) > 6 && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setShowModal(true, "breakdown")}
                    className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                  >
                    View all {sortedBreakdown?.length} →
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </AnalyticsCard>
  );
}

function CombinationsColumn({
  data,
  selectedTab,
  queryParams,
  limit,
}: {
  data: any[] | null;
  selectedTab: "clicks" | "leads" | "sales";
  queryParams: any;
  limit?: number;
}) {
  const shown = limit ? data?.slice(0, limit) : data;
  const maxValue = Math.max(
    ...(data?.map((d) => getMetricValue(d, selectedTab as any) || 0) ?? [0]),
  );

  return (
    <div className="flex flex-col px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-neutral-500">Top combinations</p>
      </div>

      {shown && shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((combo: any, idx: number) => {
            const value = getMetricValue(combo, selectedTab as any) || 0;
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <UTMCombinationRow
                key={idx}
                combo={combo}
                idx={idx}
                selectedTab={selectedTab}
                queryParams={queryParams}
                barWidth={barWidth}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-xs text-neutral-500">No combinations yet</p>
        </div>
      )}
    </div>
  );
}

function BreakdownColumn({
  mode,
  setMode,
  data,
  selectedTab,
  queryParams,
  limit,
}: {
  mode: UTMBreakdownMode;
  setMode: (mode: UTMBreakdownMode) => void;
  data: any[] | null;
  selectedTab: "clicks" | "leads" | "sales";
  queryParams: any;
  limit?: number;
}) {
  const options = [
    { value: "campaign", label: "Campaign" },
    { value: "source", label: "Source" },
    { value: "medium", label: "Medium" },
  ];

  const paramKey =
    mode === "source" ? "utm_source" : mode === "medium" ? "utm_medium" : "utm_campaign";
  const singularName =
    SINGULAR_ANALYTICS_ENDPOINTS[`${paramKey}s` as keyof typeof SINGULAR_ANALYTICS_ENDPOINTS];
  const { icon: Icon } = UTM_PARAMETERS.find((p) => p.key === paramKey)!;

  const shown = limit ? data?.slice(0, limit) : data;
  const maxValue = Math.max(
    ...(data?.map((d) => getMetricValue(d, selectedTab as any) || 0) ?? [0]),
  );

  return (
    <div className="flex flex-col px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-neutral-500">By UTM</p>
        <ToggleGroup
          options={options}
          selected={mode}
          selectAction={(value) => setMode(value as UTMBreakdownMode)}
          className="flex items-center gap-0.5 rounded border border-neutral-200 bg-neutral-100 p-0.5"
          optionClassName="h-7 flex flex-1 items-center justify-center rounded px-2 text-[11px] font-medium"
          indicatorClassName="bg-white shadow-sm"
        />
      </div>

      {shown && shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((item: any, idx: number) => {
            const value = getMetricValue(item, selectedTab as any) || 0;
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <a
                key={idx}
                href={queryParams({
                  set: { [singularName]: item[singularName] },
                  getNewPath: true,
                }) as string}
                className="relative flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200 overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-transparent group-hover:from-blue-100/60 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
                {idx < 3 && (
                  <div
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-xs font-bold flex-shrink-0 shadow-sm`}
                  >
                    {idx + 1}
                  </div>
                )}
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
                  <Icon className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {item[singularName] || "(not set)"}
                  </p>
                </div>
                <MetricsDisplay
                  clicks={item.clicks || 0}
                  leads={item.leads}
                  sales={item.sales}
                  saleAmount={item.saleAmount}
                  primaryMetric={selectedTab}
                  className="relative text-xs"
                />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-xs text-neutral-500">No data yet</p>
        </div>
      )}
    </div>
  );
}

function UTMCombinationRow({
  combo,
  idx,
  selectedTab,
  queryParams,
  barWidth,
}: {
  combo: any;
  idx: number;
  selectedTab: "clicks" | "leads" | "sales";
  queryParams: any;
  barWidth: number;
}) {
  // Build filter params from UTM combination
  const filterParams: Record<string, string> = {};
  Object.entries(combo.params).forEach(([key, value]) => {
    filterParams[key] = String(value);
  });

  const tuple: UtmTuple = combo.tuple;
  const fmt = (v: string | null) => (v && v.trim() ? v : "—");
  const leftTitle = `${fmt(tuple.utm_source)} / ${fmt(tuple.utm_medium)} / ${fmt(tuple.utm_campaign)}`;
  const leftSubtitle = `term: ${fmt(tuple.utm_term)}  •  content: ${fmt(tuple.utm_content)}`;

  return (
    <a
      href={queryParams({
        set: filterParams,
        getNewPath: true,
      }) as string}
      className="relative flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-transparent group-hover:from-blue-100/60 transition-all"
        style={{ width: `${barWidth}%` }}
      />
      {idx < 3 && (
        <div
          className={`relative flex h-6 w-6 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-xs font-bold flex-shrink-0 shadow-sm`}
        >
          {idx + 1}
        </div>
      )}
      <div className="relative flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{leftTitle}</p>
        <p className="text-xs text-neutral-500 truncate font-mono">{leftSubtitle}</p>
      </div>
      <MetricsDisplay
        clicks={combo.clicks || 0}
        leads={combo.leads}
        sales={combo.sales}
        saleAmount={combo.saleAmount}
        primaryMetric={selectedTab}
        className="relative text-xs"
      />
    </a>
  );
}

function UTMEmptyState({ slug, dashboardProps }: { slug?: string; dashboardProps?: any }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/50">
        <TrendingUp className="h-6 w-6 text-neutral-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">No UTM data yet</p>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
          Add UTM parameters to your links to see top combinations and campaign performance.
        </p>
      </div>
    </div>
  );
}
