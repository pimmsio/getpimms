import useWorkspace from "@/lib/swr/use-workspace";
import { Button, useRouterStuff, ToggleGroup, UTM_PARAMETERS } from "@dub/ui";
import { ExternalLink, Megaphone, TrendingUp } from "lucide-react";
import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { useAnalyticsFilterOption } from "./utils";
import { MetricsDisplay } from "./metrics-display";
import { ListLoadingSkeleton, NoDataYetEmptyState } from "./components";
import { useAnalyticsState, useAnalyticsDashboard } from "./hooks";
import { sortByMetric, RANK_COLORS } from "./lib";
import { AnalyticsContext } from "./analytics-provider";

type UTMViewMode = "combinations" | "source" | "medium" | "campaign";

export default function UTM({ hasData }: { hasData: boolean }) {
  const { queryParams } = useRouterStuff();
  const { slug } = useWorkspace();
  const { dashboardProps } = useAnalyticsDashboard();
  const { selectedTab } = useAnalyticsState();
  const [viewMode, setViewMode] = useState<UTMViewMode>("combinations");

  // Fetch data based on view mode
  const { data: topLinksData } = useAnalyticsFilterOption({ groupBy: "top_links" });
  const { data: sourcesData } = useAnalyticsFilterOption({ groupBy: "utm_sources" });
  const { data: mediumsData } = useAnalyticsFilterOption({ groupBy: "utm_mediums" });
  const { data: campaignsData } = useAnalyticsFilterOption({ groupBy: "utm_campaigns" });
  
  // Filter only links that have UTM parameters and extract UTM combinations
  const utmCombinations = useMemo(() => {
    if (!topLinksData) return null;
    
    const filtered = topLinksData
      .map((link: any) => {
        const params = new URLSearchParams(link.url?.split('?')[1] || '');
        const utmParams: Record<string, string> = {};
        
        // Extract UTM parameters
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
          const value = params.get(key);
          if (value) utmParams[key] = value;
        });
        
        // Only include if it has at least one UTM parameter
        if (Object.keys(utmParams).length === 0) return null;
        
        return {
          params: utmParams,
          clicks: link.clicks || 0,
          leads: link.leads || 0,
          sales: link.sales || 0,
          saleAmount: link.saleAmount || 0,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    
    // Sort using the utility function
    return sortByMetric(filtered, selectedTab as "clicks" | "leads" | "sales");
  }, [topLinksData, selectedTab]);

  const isLoading = !topLinksData;
  const hasAnyData = utmCombinations && utmCombinations.length > 0;

  const viewModeOptions = [
    { value: "combinations", label: "All" },
    { value: "source", label: "Source" },
    { value: "medium", label: "Medium" },
    { value: "campaign", label: "Campaign" },
  ];

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "utms", 
          label: "UTM Campaign Performance", 
          icon: TrendingUp
        },
      ]}
      selectedTabId="utms"
      onSelectTab={() => {}}
      expandLimit={10}
      hasMore={(utmCombinations?.length ?? 0) > 10}
      className="h-auto"
      headerActions={
        <ToggleGroup
          options={viewModeOptions}
          selected={viewMode}
          selectAction={(value) => setViewMode(value as UTMViewMode)}
          className="h-7"
          optionClassName="text-xs px-2.5"
        />
      }
    >
      {({ limit, setShowModal, isModal }) => (
        <>
          {isLoading ? (
            <div className="px-4 py-4">
              <ListLoadingSkeleton count={3} />
            </div>
          ) : !hasAnyData ? (
            <UTMEmptyState slug={slug} dashboardProps={dashboardProps} />
          ) : viewMode === "combinations" ? (
            <div className="flex flex-col px-4 py-3">
              <div className="space-y-2.5">
                {utmCombinations?.slice(0, isModal ? undefined : (limit || 10)).map((combo: any, idx: number) => (
                  <UTMCombinationItem
                    key={idx}
                    combo={combo}
                    idx={idx}
                    selectedTab={selectedTab}
                  />
                ))}
              </div>
              
              {!isModal && (utmCombinations?.length ?? 0) > (limit || 10) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full rounded-lg border border-brand-primary-200 bg-brand-primary-50 py-2.5 text-sm text-brand-primary-700 hover:bg-brand-primary-100 hover:border-brand-primary-300 font-semibold transition-all shadow-sm"
                >
                  View all {utmCombinations?.length} combinations →
                </button>
              )}
            </div>
          ) : (
            <UTMBreakdownView
              viewMode={viewMode}
              sourcesData={sourcesData}
              mediumsData={mediumsData}
              campaignsData={campaignsData}
              selectedTab={selectedTab}
              queryParams={queryParams}
              setShowModal={setShowModal}
              isModal={isModal}
            />
          )}
        </>
      )}
    </AnalyticsCard>
  );
}

function UTMBreakdownView({
  viewMode,
  sourcesData,
  mediumsData,
  campaignsData,
  selectedTab,
  queryParams,
  setShowModal,
  isModal,
}: {
  viewMode: UTMViewMode;
  sourcesData: any;
  mediumsData: any;
  campaignsData: any;
  selectedTab: "clicks" | "leads" | "sales";
  queryParams: any;
  setShowModal: (show: boolean) => void;
  isModal?: boolean;
}) {
  const data = viewMode === "source" ? sourcesData : viewMode === "medium" ? mediumsData : campaignsData;
  const paramKey = viewMode === "source" ? "utm_source" : viewMode === "medium" ? "utm_medium" : "utm_campaign";
  const singularName = SINGULAR_ANALYTICS_ENDPOINTS[`${paramKey}s` as keyof typeof SINGULAR_ANALYTICS_ENDPOINTS];
  const { icon: Icon } = UTM_PARAMETERS.find((p) => p.key === paramKey)!;

  // Sort data by selected metric using utility function
  const sortedData = useMemo(() => {
    if (!data) return null;
    return sortByMetric(data, selectedTab as "clicks" | "leads" | "sales");
  }, [data, selectedTab]);

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="flex h-[380px] items-center justify-center px-4 text-center">
        <p className="text-sm text-neutral-600">No {viewMode} data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-3">
      <div className="space-y-2">
        {sortedData.slice(0, 8).map((item: any, idx: number) => (
          <a
            key={idx}
            href={queryParams({
              set: { [singularName]: item[singularName] },
              getNewPath: true,
            }) as string}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200"
          >
            {idx < 3 && (
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-xs font-bold flex-shrink-0 shadow-sm`}>
                {idx + 1}
              </div>
            )}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
              <Icon className="h-4 w-4 text-neutral-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-neutral-900 truncate min-w-0">
              {item[singularName] || "(not set)"}
            </span>
            <MetricsDisplay
              clicks={item.clicks || 0}
              leads={item.leads}
              sales={item.sales}
              saleAmount={item.saleAmount}
              primaryMetric={selectedTab}
            />
          </a>
        ))}
      </div>
      
      {!isModal && sortedData.length > 8 && (
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 w-full rounded-lg border border-brand-primary-200 bg-brand-primary-50 py-2 text-xs text-brand-primary-700 hover:bg-brand-primary-100 hover:border-brand-primary-300 font-semibold transition-all"
        >
          View all {sortedData.length} →
        </button>
      )}
    </div>
  );
}

function UTMCombinationItem({ combo, idx, selectedTab }: { combo: any; idx: number; selectedTab: "clicks" | "leads" | "sales" }) {
  const utmEntries = Object.entries(combo.params);
  const gradientColors = ['from-neutral-300 to-neutral-400', 'from-neutral-300 to-neutral-400', 'from-neutral-300 to-neutral-400'];
  const isTopThree = idx < 3;
  
  // Calculate conversion quality
  const conversionRate = combo.clicks > 0 && combo.leads > 0 ? (combo.leads / combo.clicks) * 100 : 0;
  const isHighConverter = conversionRate > 5; // 5%+ is considered good

  return (
    <div 
      className={`group relative rounded-xl border transition-all p-3.5 ${
        isTopThree 
          ? 'border-brand-primary-200 bg-gradient-to-br from-brand-primary-50/50 via-white to-brand-primary-100/30 hover:shadow-md hover:border-brand-primary-300' 
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      {/* High converter badge */}
      {isHighConverter && (
        <div className="absolute -top-2 -left-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg animate-pulse">
          ⭐ High CVR
        </div>
      )}
      
      <div className="flex items-start gap-3">
        {/* Ranking badge for top 3 */}
        {isTopThree && (
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradientColors[idx]} text-xs font-bold text-white shadow-sm`}>
            {idx + 1}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* UTM parameters */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 mb-2">
            {utmEntries.map(([key, value], paramIdx) => (
              <div key={paramIdx} className="flex items-center">
                <span className="text-xs text-neutral-500 font-mono">{key.replace('utm_', '')}=</span>
                <span className="ml-1 rounded-md bg-brand-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {String(value)}
                </span>
                {paramIdx < utmEntries.length - 1 && (
                  <span className="mx-1.5 text-xs text-neutral-400 font-medium">&</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Metrics */}
                      <MetricsDisplay
                        clicks={combo.clicks || 0}
                        leads={combo.leads}
                        sales={combo.sales}
                        saleAmount={combo.saleAmount}
                        primaryMetric={selectedTab}
                        className="text-xs"
                      />
        </div>

      </div>
    </div>
  );
}

function UTMEmptyState({ slug, dashboardProps }: { slug?: string; dashboardProps?: any }) {
  return (
    <div className="flex h-[380px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-500/10 to-brand-primary-100/10 ring-1 ring-brand-primary-600/20 animate-pulse">
        <TrendingUp className="h-7 w-7 text-brand-primary-600" />
      </div>
      
      <h3 className="mb-2 text-base font-semibold text-neutral-900">
        Track Your Best Campaigns
      </h3>
      
      <p className="mb-6 max-w-md text-sm text-neutral-600 leading-relaxed">
        See which UTM combinations drive the most clicks, conversions, and revenue
      </p>
      
      <div className="mb-6 rounded-xl border border-brand-primary-200 bg-gradient-to-br from-brand-primary-50 to-brand-primary-100 p-4 max-w-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 font-mono text-xs">
          <span className="text-neutral-500">source=</span>
          <span className="rounded-md bg-brand-primary-600 px-2 py-0.5 font-semibold text-white">google</span>
          <span className="text-neutral-400 font-medium">&</span>
          <span className="text-neutral-500">medium=</span>
          <span className="rounded-md bg-brand-primary-600 px-2 py-0.5 font-semibold text-white">cpc</span>
          <span className="text-neutral-400 font-medium">&</span>
          <span className="text-neutral-500">campaign=</span>
          <span className="rounded-md bg-brand-primary-600 px-2 py-0.5 font-semibold text-white">summer-sale</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-brand-primary-600 font-medium">
          <TrendingUp className="h-3 w-3" />
          1,247 clicks
        </div>
      </div>
    </div>
  );
}
