import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { groupReferrerAnalytics, getReferrerDisplayName, isGroupedReferrer, getDomainsForReferrerGroup, getBestDomainForLogo } from "@/lib/analytics/utils";
import { UTM_TAGS_PLURAL, UTM_TAGS_PLURAL_LIST } from "@/lib/zod/schemas/utm";
import { BlurImage, useRouterStuff, UTM_PARAMETERS } from "@dub/ui";
import { Note, ReferredVia } from "@dub/ui/icons";
import { getGoogleFavicon } from "@dub/utils";
import { Link2 } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";

export default function Referer() {
  const { queryParams, searchParams } = useRouterStuff();

  const { selectedTab, saleUnit } = useContext(AnalyticsContext);
  const dataKey = selectedTab === "sales" ? saleUnit : "count";

  const [tab, setTab] = useState<"referers" | "utms">("referers");
  const [utmTag, setUtmTag] = useState<UTM_TAGS_PLURAL>("utm_sources");

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: tab === "utms" ? utmTag : "referers",
  });

  const singularTabName =
    SINGULAR_ANALYTICS_ENDPOINTS[tab === "utms" ? utmTag : "referers"];

  // Group referrer data when displaying referers
  const data = useMemo(() => {
    if (!rawData || tab === "utms") return rawData;
    
    // Check if we're filtering by a grouped referrer
    const refererFilter = searchParams.get(singularTabName);
    if (refererFilter && isGroupedReferrer(refererFilter)) {
      // Filter raw data to show only items that belong to this group
      const filteredData = rawData.filter(item => {
        const referrerValue = item.referer || item.referers || '';
        const groupName = getReferrerDisplayName(referrerValue);
        return groupName === refererFilter;
      });
      
      // Then group the filtered data to show the grouped item
      return groupReferrerAnalytics(filteredData);
    }
    
    // Always show grouped data for referrers
    return groupReferrerAnalytics(rawData);
  }, [rawData, tab, searchParams, singularTabName]);

  const { icon: UTMTagIcon } = UTM_PARAMETERS.find(
    (p) => p.key === utmTag.slice(0, -1),
  )!;

  const subTabProps = useMemo(() => {
    return (
      {
        utms: {
          subTabs: [
            { id: "all", label: "All" },
            ...UTM_TAGS_PLURAL_LIST.map((u) => ({
              id: u,
              label: SINGULAR_ANALYTICS_ENDPOINTS[u].replace("utm_", "").charAt(0).toUpperCase() + SINGULAR_ANALYTICS_ENDPOINTS[u].replace("utm_", "").slice(1),
            })),
          ],
          selectedSubTabId: utmTag === "utm_sources" ? "utm_sources" : utmTag,
          onSelectSubTab: (value: string) => {
            if (value === "all") {
              setUtmTag("utm_sources"); // Default to sources when "All" is selected
            } else {
              setUtmTag(value as UTM_TAGS_PLURAL);
            }
          },
        },
      }[tab] ?? {}
    );
  }, [tab, utmTag]);

  return (
    <AnalyticsCard
      tabs={[
        { id: "referers", label: "Referrers", icon: ReferredVia },
        { id: "utms", label: "UTM Params", icon: Note },
      ]}
      selectedTabId={tab}
      onSelectTab={setTab}
      {...subTabProps}
      expandLimit={8}
      hasMore={(data?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {data ? (
            data.length > 0 ? (
              <MixedBarList
                tab={tab === "utms" ? "UTM Param" : "Referrer"}
                data={
                  data
                    ?.map((d) => ({
                      icon:
                        tab === "utms" ? (
                          <UTMTagIcon className="h-4 w-4" />
                        ) : d[singularTabName] === "(direct)" ? (
                          <Link2 className="h-4 w-4" />
                        ) : (
                          <BlurImage
                            src={getGoogleFavicon(
                              getBestDomainForLogo(getReferrerDisplayName(d[singularTabName])),
                              false,
                            )}
                            alt={getReferrerDisplayName(d[singularTabName])}
                            width={20}
                            height={20}
                            className="h-4 w-4 rounded-full"
                          />
                        ),
                        title: tab === "utms" ? d[singularTabName] : getReferrerDisplayName(d[singularTabName]),
                        href: queryParams({
                        ...(searchParams.has(singularTabName)
                          ? { del: singularTabName }
                          : {
                              set: {
                                [singularTabName]: (() => {
                                  // If this is a grouped referrer, use all domains from the group
                                  if (isGroupedReferrer(d[singularTabName])) {
                                    return getDomainsForReferrerGroup(d[singularTabName]).join(',');
                                  }
                                  // Otherwise use the original referrer
                                  return d[singularTabName];
                                })(),
                              },
                            }),
                        getNewPath: true,
                      }) as string,
                      clicks: d.clicks || 0,
                      leads: d.leads || 0,
                      sales: d.sales || 0,
                      saleAmount: d.saleAmount || 0,
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
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
