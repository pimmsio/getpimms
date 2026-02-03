import { EventType } from "@/lib/analytics/types";

import { useContext, useMemo } from "react";
import { AnalyticsContext } from "./analytics-provider";

import MixedAnalyticsChart from "./mixed-analytics-chart";

type Tab = {
  id: EventType;
  label: string;
  colorClassName: string;
  conversions: boolean;
};

export default function Main() {
  const {
    showConversions,
    selectedTab,
    view,
    workspace,
  } = useContext(AnalyticsContext);

  const tabs = useMemo(
    () =>
      [
        {
          id: "clicks",
          label: "Clicks",
          colorClassName: "text-brand-primary",
          conversions: false,
        },
        ...(showConversions
          ? [
              {
                id: "leads",
                label: "Contacts",
                colorClassName: "text-yellow",
                conversions: true,
              },
              {
                id: "sales",
                label: "Revenue",
                colorClassName: "text-green",
                conversions: true,
              },
            ]
          : []),
      ] as Tab[],
    [showConversions],
  );

  const tab = tabs.find(({ id }) => id === selectedTab) ?? tabs[0];

  return (
    <div className="w-full overflow-hidden">
      {/* Enhanced metrics section */}
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-lg border border-neutral-100 bg-white"
        >
          {view === "timeseries" && (
            <MixedAnalyticsChart demo={false} />
          )}
          {/* {view === "funnel" && <AnalyticsFunnelChart demo={showPaywall} />} */}
        </div>
      </div>
    </div>
  );
}
