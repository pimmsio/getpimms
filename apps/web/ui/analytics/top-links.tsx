import { useWorkspacePreferences } from "@/lib/swr/use-workspace-preferences";
import { LinkLogo, useRouterStuff } from "@dub/ui";
import { Hyperlink } from "@dub/ui/icons";
import { getApexDomain } from "@dub/utils";
import { useCallback, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";

export default function TopLinks() {
  const { queryParams, searchParams } = useRouterStuff();

  const [tab, setTab] = useState<"links" | "urls">("links");

  const { data } = useAnalyticsFilterOption({
    groupBy: `top_${tab}`,
  });

  const [persisted] = useWorkspacePreferences("linksDisplay");

  const shortLinkTitle = useCallback(
    (d: { url?: string; title?: string; shortLink?: string }) => {
      if (tab === "urls") {
        return d.url || "Unknown";
      }

      const displayProperties = persisted?.displayProperties;

      if (displayProperties?.includes("title") && d.title) {
        return d.title;
      }

      return d.shortLink || "Unknown";
    },
    [persisted, tab],
  );

  return (
    <AnalyticsCard
      tabs={[{ id: "links", label: "Deeplinks", icon: Hyperlink }]}
      expandLimit={5}
      hasMore={(data?.length ?? 0) > 8}
      selectedTabId="links"
      onSelectTab={setTab}
    >
      {({ limit, setShowModal }) =>
        data ? (
          data.length > 0 ? (
            <MixedBarList
              tab={tab}
              data={
                data
                  ?.map((d) => ({
                    icon: (
                      <LinkLogo
                        apexDomain={getApexDomain(d.url)}
                        className="size-5 sm:size-5"
                      />
                    ),
                    title: shortLinkTitle(d as any),
                    // TODO: simplify this once we switch from domain+key to linkId
                    href: queryParams({
                      ...((tab === "links" &&
                        searchParams.has("domain") &&
                        searchParams.has("key")) ||
                      (tab === "urls" && searchParams.has("url"))
                        ? { del: tab === "links" ? ["domain", "key"] : "url" }
                        : {
                            set: {
                              ...(tab === "links"
                                ? { domain: d.domain, key: d.key || "_root" }
                                : {
                                    url: d.url,
                                  }),
                            },
                          }),
                      getNewPath: true,
                    }) as string,
                    clicks: d.clicks || 0,
                    leads: d.leads || 0,
                    sales: d.sales || 0,
                    saleAmount: d.saleAmount || 0,
                    linkData: d, // Pass linkData for both links and urls
                  }))
                  ?.sort((a, b) => b.clicks - a.clicks) || []
              }
              setShowModal={setShowModal}
              {...(limit && { limit })}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-neutral-600">No data available</p>
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex h-[300px] w-full items-center justify-center bg-white/50">
            <AnalyticsLoadingSpinner />
          </div>
        )
      }
    </AnalyticsCard>
  );
}
