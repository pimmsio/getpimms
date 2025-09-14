import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { useRouterStuff } from "@dub/ui";
import {
  FlagWavy,
  MapPosition,
  OfficeBuilding,
} from "@dub/ui/icons";
import { CONTINENTS, COUNTRIES, REGIONS } from "@dub/utils";
import { useContext, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsContext } from "./analytics-provider";
import MixedBarList from "./mixed-bar-list";
import ContinentIcon from "./continent-icon";
import WorldMap from "./world-map";
import { useAnalyticsFilterOption } from "./utils";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";

export default function Locations() {
  const { queryParams, searchParams } = useRouterStuff();

  const { selectedTab, saleUnit } = useContext(AnalyticsContext);
  const dataKey = selectedTab === "sales" ? saleUnit : "count";

  const [tab, setTab] = useState<
    "map" | "countries" | "cities" | "continents" | "regions"
  >("map");

  const { data } = useAnalyticsFilterOption(tab === "map" ? "countries" : tab);
  const singularTabName = SINGULAR_ANALYTICS_ENDPOINTS[tab === "map" ? "countries" : tab];

  return (
    <AnalyticsCard
      tabs={[
        { id: "map", label: "Map", icon: MapPosition },
        { id: "countries", label: "Countries", icon: FlagWavy },
        { id: "cities", label: "Cities", icon: OfficeBuilding },
        // { id: "regions", label: "Regions", icon: LocationPin },
        // { id: "continents", label: "Continents", icon: MapPosition },
      ]}
      selectedTabId={tab}
      onSelectTab={setTab}
      expandLimit={8}
      hasMore={(data?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) =>
        data ? (
          data.length > 0 ? (
            tab === "map" ? (
              <WorldMap
                data={data?.map((d) => ({
                  country: COUNTRIES[d.country] || d.country,
                  countryCode: d.country,
                  clicks: d.clicks || 0,
                  leads: d.leads || 0,
                  sales: d.sales || 0,
                  saleAmount: d.saleAmount || 0,
                })) || []}
                maxVisitors={Math.max(...(data?.map((d) => d.clicks || 0) || [0]))}
              />
            ) : (
              <MixedBarList
                tab={singularTabName}
                data={
                  data
                    ?.map((d) => ({
                      icon:
                        tab === "continents" ? (
                          <ContinentIcon
                            display={d.continent}
                            className="size-3"
                          />
                        ) : (
                          <img
                            alt={d.country}
                            src={`https://flag.vercel.app/m/${d.country}.svg`}
                            className="h-3 w-5"
                          />
                        ),
                      title:
                        tab === "continents"
                          ? CONTINENTS[d.continent]
                          : tab === "countries"
                            ? COUNTRIES[d.country]
                            : tab === "regions"
                              ? REGIONS[d.region] || d.region.split("-")[1]
                              : d.city,
                      href: queryParams({
                        ...(searchParams.has(singularTabName)
                          ? { del: singularTabName }
                          : {
                              set: {
                                [singularTabName]: d[singularTabName],
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
            )
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
