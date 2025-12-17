import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { useRouterStuff } from "@dub/ui";
import { MobilePhone } from "@dub/ui/icons";
import { AnalyticsCard } from "./analytics-card";
import DeviceIcon from "./device-icon";
import { MetricsDisplay } from "./metrics-display";
import { CardLoadingSkeleton, NoDataYetEmptyState } from "./components";
import { useMultipleSortedAnalytics } from "./hooks";
import { hasAnyData as checkHasAnyData, RANK_COLORS } from "./lib";
import { useAnalyticsState } from "./hooks";

export default function Devices({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  // Fetch and sort all device types at once
  const { devices: sortedDevicesData, browsers: sortedBrowsersData, os: sortedOsData, isLoading } = 
    useMultipleSortedAnalytics({
      devices: "devices",
      browsers: "browsers",
      os: "os",
    });

  const hasAnyData = checkHasAnyData(sortedDevicesData, sortedBrowsersData, sortedOsData);

  return (
    <AnalyticsCard
      tabs={[{ id: "devices", label: "Devices & Tech", icon: MobilePhone }]}
      selectedTabId="devices"
      onSelectTab={() => {}}
      expandLimit={5}
      hasMore={false}
      className="h-[600px]"
      dragHandleProps={dragHandleProps}
    >
      {({ setShowModal, isModal, modalSection }) => (
        <>
          {isLoading ? (
            <CardLoadingSkeleton sections={3} />
          ) : !hasAnyData ? (
            <NoDataYetEmptyState
              icon={MobilePhone}
              dataType="device data"
              description="Device, browser, and OS analytics will appear once visitors start clicking your links"
            />
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {/* Show all sections in card view, only specific section in modal view */}
              {(!isModal || modalSection === "devices") && sortedDevicesData && sortedDevicesData.length > 0 && (
                <DeviceSection
                  title="Top Devices"
                  data={isModal ? sortedDevicesData : sortedDevicesData.slice(0, 5)}
                  totalCount={sortedDevicesData.length}
                  type="devices"
              queryParams={queryParams}
              selectedTab={selectedTab as "clicks" | "leads" | "sales"}
              onViewAll={() => setShowModal(true, "devices")}
              isModal={isModal}
                />
              )}
              
              {/* Browsers Section */}
              {(!isModal || modalSection === "browsers") && sortedBrowsersData && sortedBrowsersData.length > 0 && (
                <DeviceSection
                  title="Top Browsers"
                  data={isModal ? sortedBrowsersData : sortedBrowsersData.slice(0, 5)}
                  totalCount={sortedBrowsersData.length}
                  type="browsers"
                  queryParams={queryParams}
                  selectedTab={selectedTab as "clicks" | "leads" | "sales"}
                  onViewAll={() => setShowModal(true, "browsers")}
                  isModal={isModal}
                />
              )}
              
              {/* OS Section */}
              {(!isModal || modalSection === "os") && sortedOsData && sortedOsData.length > 0 && (
                <DeviceSection
                  title="Top OS"
                  data={isModal ? sortedOsData : sortedOsData.slice(0, 5)}
                  totalCount={sortedOsData.length}
                  type="os"
                  queryParams={queryParams}
                  selectedTab={selectedTab as "clicks" | "leads" | "sales"}
                  onViewAll={() => setShowModal(true, "os")}
                  isModal={isModal}
                />
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}

function DeviceSection({
  title,
  data,
  totalCount,
  type,
  queryParams,
  selectedTab,
  onViewAll,
  isModal,
}: {
  title: string;
  data: any[];
  totalCount: number;
  type: "devices" | "browsers" | "os";
  queryParams: any;
  selectedTab: "clicks" | "leads" | "sales";
  onViewAll: () => void;
  isModal?: boolean;
}) {
  const singularName = SINGULAR_ANALYTICS_ENDPOINTS[type];

  return (
    <div className="py-3 px-4 first:pt-4 last:pb-4 border-b border-neutral-100 last:border-0">
      <h4 className="mb-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2">
        {data.map((item, idx) => {
          const value = item[singularName];
          const metric = selectedTab === "sales" ? item.saleAmount : selectedTab === "leads" ? item.leads : item.clicks;

          return (
            <a
              key={idx}
              href={queryParams({
                set: { [singularName]: value },
                getNewPath: true,
              }) as string}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200"
            >
              {idx < 3 && (
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                  {idx + 1}
                </div>
              )}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
                <DeviceIcon
                  display={value}
                  tab={type}
                  className="h-3.5 w-3.5 text-neutral-600"
                />
              </div>
              <span className="flex-1 text-xs font-medium text-neutral-900 truncate min-w-0">
                {value}
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
      
      {!isModal && totalCount > 5 && (
        <button
          onClick={onViewAll}
          className="mt-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
        >
          View all {totalCount} →
        </button>
      )}
    </div>
  );
}
