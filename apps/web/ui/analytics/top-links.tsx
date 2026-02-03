import { LinkLogo, Tooltip, useRouterStuff } from "@dub/ui";
import { Hyperlink } from "@dub/ui/icons";
import { cn, getApexDomain } from "@dub/utils";
import { useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsEmptyState } from "./components/empty-states";
import { useAnalyticsState, useSortedAnalytics } from "./hooks";
import {
  LINK_LOGO_IMAGE_PROPS,
  LOGO_SIZE_CLASS_NAME,
  RANK_COLORS,
} from "./lib";
import { MetricsDisplay } from "./metrics-display";

export default function TopLinks({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  const { data: sortedData } = useSortedAnalytics("top_links");

  const totalClicks = useMemo(
    () =>
      sortedData?.reduce((sum: number, d: any) => sum + (d.clicks || 0), 0) ||
      0,
    [sortedData],
  );

  const totalLeads = useMemo(
    () =>
      sortedData?.reduce((sum: number, d: any) => sum + (d.leads || 0), 0) || 0,
    [sortedData],
  );

  return (
    <AnalyticsCard
      tabs={[{ id: "links", label: "Top Links", icon: Hyperlink }]}
      expandLimit={5}
      hasMore={(sortedData?.length ?? 0) > 5}
      selectedTabId="links"
      onSelectTab={() => {}}
      dragHandleProps={dragHandleProps}
    >
      {({ limit, setShowModal, isModal }) =>
        sortedData ? (
          sortedData.length > 0 ? (
            <div className="flex flex-col px-4 py-3">
              <div className="space-y-2">
                {sortedData
                  ?.slice(0, isModal ? undefined : limit)
                  .map((d: any, idx: number) => {
                    const shortLink = `${d.domain}/${d.key === "_root" ? "" : d.key}`;
                    const domain = getApexDomain(d.url);
                    const maxClicks = Math.max(
                      ...(sortedData?.map((item: any) => item.clicks || 0) || [
                        0,
                      ]),
                    );
                    const barWidth =
                      maxClicks > 0 ? (d.clicks / maxClicks) * 100 : 0;

                    return (
                      <Tooltip
                        key={idx}
                        content={
                          <div className="max-w-xs p-2">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">
                              {shortLink}
                            </p>
                            <p className="mb-2 break-all text-xs text-neutral-600">
                              {d.url}
                            </p>
                            {d.updatedAt && (
                              <p className="mb-2 text-xs text-neutral-500">
                                Updated:{" "}
                                {new Date(d.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex gap-3 border-t border-neutral-100 pt-2 text-xs">
                              <span className="text-neutral-500">
                                Clicks: <strong>{d.clicks}</strong>
                              </span>
                              {d.leads > 0 && (
                                <span className="text-neutral-500">
                                  Contacts: <strong>{d.leads}</strong>
                                </span>
                              )}
                              {d.sales > 0 && (
                                <span className="text-neutral-500">
                                  Revenue: <strong>{d.sales}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        }
                      >
                        <a
                          href={
                            queryParams({
                              set: { domain: d.domain, key: d.key || "_root" },
                              getNewPath: true,
                            }) as string
                          }
                          className="app-row group relative overflow-hidden px-3 py-1.5"
                        >
                          {/* minimal progress (subtle) */}
                          <div
                            className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-100/60"
                            style={{ width: `${barWidth}%` }}
                          />
                          {idx < 3 && (
                            <div
                              className={`relative flex h-6 w-6 items-center justify-center rounded-md ${RANK_COLORS[idx]} flex-shrink-0 text-xs font-bold`}
                            >
                              {idx + 1}
                            </div>
                          )}
                          <LinkLogo
                            apexDomain={domain}
                            className={cn(
                              "relative shrink-0 transition-[width,height]",
                              LOGO_SIZE_CLASS_NAME,
                            )}
                            imageProps={LINK_LOGO_IMAGE_PROPS}
                          />
                          <div className="relative min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-900">
                              {shortLink}
                            </p>
                            {d.title && (
                              <p className="truncate text-xs text-neutral-500">
                                {d.title}
                              </p>
                            )}
                          </div>
                          <MetricsDisplay
                            clicks={d.clicks || 0}
                            leads={d.leads}
                            sales={d.sales}
                            saleAmount={d.saleAmount}
                            totalClicks={totalClicks}
                            totalLeads={totalLeads}
                            primaryMetric={selectedTab}
                            className="relative"
                          />
                        </a>
                      </Tooltip>
                    );
                  })}
              </div>

              {!isModal && (sortedData?.length ?? 0) > 5 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="app-btn-muted mt-4 w-full"
                >
                  View all {sortedData?.length} links →
                </button>
              )}
            </div>
          ) : (
            <AnalyticsEmptyState
              icon={Hyperlink}
              title="No link data yet"
              description="Compare performance across all your short links"
            />
          )
        ) : (
          <div className="flex animate-pulse flex-col px-4 py-3">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="app-row group relative overflow-hidden px-3 py-1.5"
                >
                  {/* subtle bar background (mimics the real minimal progress) */}
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-100"
                    style={{ width: `${Math.max(12, 78 - i * 12)}%` }}
                  />

                  {i < 3 ? (
                    <div
                      className={`relative flex h-6 w-6 items-center justify-center rounded-md ${RANK_COLORS[i]} flex-shrink-0`}
                    >
                      <div className="h-3 w-3 rounded bg-white/40" />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "relative shrink-0 rounded-md bg-neutral-100",
                      LOGO_SIZE_CLASS_NAME,
                    )}
                  />

                  <div className="relative min-w-0 flex-1">
                    <div className="h-4 w-40 max-w-[80%] rounded bg-neutral-100" />
                    <div className="mt-1 h-3 w-24 max-w-[60%] rounded bg-neutral-50" />
                  </div>

                  <div className="relative flex items-center gap-2.5">
                    <div className="h-4 w-10 rounded bg-neutral-100" />
                    <div className="h-3 w-1 rounded bg-neutral-50" />
                    <div className="h-4 w-10 rounded bg-neutral-100" />
                    <div className="h-3 w-1 rounded bg-neutral-50" />
                    <div className="h-4 w-14 rounded bg-neutral-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </AnalyticsCard>
  );
}
