import { BlurImage, useRouterStuff } from "@dub/ui";
import { ExternalLink } from "lucide-react";
import { getGoogleFavicon, getApexDomain } from "@dub/utils";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";

export default function DestinationUrls() {
  const { queryParams } = useRouterStuff();

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  const singularTabName = "url";

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "urls", 
          label: "Destination URLs", 
          icon: ExternalLink
        },
      ]}
      selectedTabId="urls"
      onSelectTab={() => {}} // No tab switching
      expandLimit={8}
      hasMore={(rawData?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {rawData ? (
            rawData.length > 0 ? (
              <MixedBarList
                tab="Destination URL"
                data={
                  rawData
                    ?.map((d) => {
                      const url = d.url || '';
                      const domain = getApexDomain(url);
                      
                      return {
                        icon: (
                          <BlurImage
                            src={getGoogleFavicon(domain, false)}
                            alt={domain}
                            width={20}
                            height={20}
                            className="h-4 w-4 rounded-full"
                          />
                        ),
                        title: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
                        href: queryParams({
                          set: {
                            [singularTabName]: url,
                          },
                          getNewPath: true,
                        }) as string,
                        clicks: d.clicks || 0,
                        leads: d.leads || 0,
                        sales: d.sales || 0,
                        saleAmount: d.saleAmount || 0,
                      };
                    })
                    ?.slice(0, limit)
                }
                setShowModal={setShowModal}
                {...(limit && { limit })}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-gray-600">No data available</p>
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
