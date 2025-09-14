import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { UTM_TAGS_PLURAL, UTM_TAGS_PLURAL_LIST } from "@/lib/zod/schemas/utm";
import { useRouterStuff, UTM_PARAMETERS } from "@dub/ui";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";

export default function UTM() {
  const { queryParams } = useRouterStuff();

  const [utmTag, setUtmTag] = useState<UTM_TAGS_PLURAL>("utm_sources");

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: utmTag,
  });

  const singularTabName = SINGULAR_ANALYTICS_ENDPOINTS[utmTag];

  const { icon: UTMTagIcon } = UTM_PARAMETERS.find(
    (p) => p.key === utmTag.slice(0, -1),
  )!;

  const subTabProps = useMemo(() => {
    return {
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
    };
  }, [utmTag]);

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "utms", 
          label: "UTM Campaigns", 
          icon: FileText
        },
      ]}
      selectedTabId="utms"
      onSelectTab={() => {}} // No tab switching
      {...subTabProps}
      expandLimit={8}
      hasMore={(rawData?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {rawData ? (
            rawData.length > 0 ? (
              <MixedBarList
                tab="UTM Param"
                data={
                  rawData
                    ?.map((d) => ({
                      icon: <UTMTagIcon className="h-4 w-4" />,
                      title: d[singularTabName],
                      href: queryParams({
                        set: {
                          [singularTabName]: d[singularTabName],
                        },
                        getNewPath: true,
                      }) as string,
                      clicks: d.clicks || 0,
                      leads: d.leads || 0,
                      sales: d.sales || 0,
                      saleAmount: d.saleAmount || 0,
                    }))
                    ?.slice(0, limit)
                }
                setShowModal={setShowModal}
                {...(limit && { limit })}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-gray-600">No UTM data available</p>
              </div>
            )
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <AnalyticsLoadingSpinner />
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
