import { useRouterStuff } from "@dub/ui";
import { MapPosition } from "@dub/ui/icons";
import { COUNTRIES } from "@dub/utils";
import { AnalyticsCard } from "./analytics-card";
import WorldMap from "./world-map";
import { MetricsDisplay } from "./metrics-display";
import { LocationLoadingSkeleton, NoDataYetEmptyState } from "./components";
import { useMultipleSortedAnalytics, useAnalyticsState } from "./hooks";
import { hasAnyData, RANK_COLORS } from "./lib";

export default function Locations() {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  const { countries: sortedCountriesData, cities: sortedCitiesData, isLoading } = 
    useMultipleSortedAnalytics({
      countries: "countries",
      cities: "cities",
    });

  const hasData = hasAnyData(sortedCountriesData, sortedCitiesData);

  return (
    <AnalyticsCard
      tabs={[{ id: "locations", label: "Locations", icon: MapPosition }]}
      selectedTabId="locations"
      onSelectTab={() => {}}
      expandLimit={5}
      hasMore={false}
      className="h-[600px]"
    >
      {({ setShowModal, isModal, modalSection }) => (
        <>
          {isLoading ? (
            <LocationLoadingSkeleton />
          ) : !hasData ? (
            <NoDataYetEmptyState
              icon={MapPosition}
              dataType="location data"
              description="See where your visitors are coming from around the world"
            />
          ) : (
            <div className="flex flex-col overflow-hidden">
              {/* Map View - Only show in card view and countries section */}
              {!isModal && (
                <div className="h-[320px] overflow-hidden">
                  <WorldMap
                    data={sortedCountriesData?.map((d) => ({
                      country: COUNTRIES[d.country] || d.country,
                      countryCode: d.country,
                      clicks: d.clicks || 0,
                      leads: d.leads || 0,
                      sales: d.sales || 0,
                      saleAmount: d.saleAmount || 0,
                    })) || []}
                    maxVisitors={Math.max(...(sortedCountriesData?.map((d) => d.clicks || 0) || [0]))}
                  />
                </div>
              )}

              {/* Top Countries List */}
              {(!isModal || modalSection === "countries") && (
                <div className="border-t border-neutral-100 py-3 px-4 flex-1 overflow-auto">
                  <h4 className="mb-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Top Countries
                  </h4>
                  <div className="space-y-1.5">
                    {(isModal ? sortedCountriesData : sortedCountriesData?.slice(0, 5))?.map((item, idx) => {
                    return (
                      <a
                        key={idx}
                        href={queryParams({
                          set: { country: item.country },
                          getNewPath: true,
                        }) as string}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200"
                      >
                        {idx < 3 && (
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                            {idx + 1}
                          </div>
                        )}
                        <img
                          alt={item.country}
                          src={`https://flag.vercel.app/m/${item.country}.svg`}
                          className="h-3 w-5 flex-shrink-0"
                        />
                        <span className="flex-1 text-xs font-medium text-neutral-900 truncate min-w-0">
                          {COUNTRIES[item.country]}
                        </span>
                        <MetricsDisplay
                          clicks={item.clicks || 0}
                          leads={item.leads}
                          sales={item.sales}
                          saleAmount={item.saleAmount}
                          primaryMetric={selectedTab}
                          className="text-xs"
                        />
                      </a>
                    );
                  })}
                </div>
                
                {!isModal && sortedCountriesData && sortedCountriesData.length > 5 && (
                  <button
                    onClick={() => setShowModal(true, "countries")}
                    className="mt-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                  >
                    View all {sortedCountriesData.length} countries →
                  </button>
                )}
              </div>
              )}

              {/* Top Cities List */}
              {(!isModal || modalSection === "cities") && sortedCitiesData && sortedCitiesData.length > 0 && (
                <div className="border-t border-neutral-100 py-3 px-4">
                  <h4 className="mb-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Top Cities
                  </h4>
                  <div className="space-y-1.5">
                    {(isModal ? sortedCitiesData : sortedCitiesData?.slice(0, 5))?.map((item: any, idx: number) => (
                      <a
                        key={idx}
                        href={queryParams({
                          set: { city: item.city },
                          getNewPath: true,
                        }) as string}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200"
                      >
                        <img
                          alt={item.country}
                          src={`https://flag.vercel.app/m/${item.country}.svg`}
                          className="h-3 w-5 flex-shrink-0"
                        />
                        <span className="flex-1 text-xs font-medium text-neutral-900 truncate min-w-0">
                          {item.city}
                        </span>
                        <MetricsDisplay
                          clicks={item.clicks || 0}
                          leads={item.leads}
                          sales={item.sales}
                          saleAmount={item.saleAmount}
                          primaryMetric={selectedTab}
                          className="text-xs"
                        />
                      </a>
                    ))}
                  </div>
                  
                  {!isModal && sortedCitiesData && sortedCitiesData.length > 5 && (
                    <button
                      onClick={() => setShowModal(true, "cities")}
                      className="mt-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                    >
                      View all {sortedCitiesData.length} cities →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
