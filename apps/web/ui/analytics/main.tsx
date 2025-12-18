import { EventType } from "@/lib/analytics/types";

import { cn } from "@dub/utils";
import { Coins } from "lucide-react";
import { useContext, useMemo } from "react";
import { AppButtonLink } from "@/ui/components/controls/app-button";
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
  const { plan } = workspace || {};

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
                label: "Leads",
                colorClassName: "text-yellow",
                conversions: true,
              },
              {
                id: "sales",
                label: "Sales",
                colorClassName: "text-green",
                conversions: true,
              },
            ]
          : []),
      ] as Tab[],
    [showConversions],
  );

  const tab = tabs.find(({ id }) => id === selectedTab) ?? tabs[0];

  const showPaywall =
    (tab.id === "sales" || view === "funnel") && plan === "free";


  return (
    <div className="w-full overflow-hidden">
      {/* Enhanced metrics section */}
      <div className="relative">
        <div
          className={cn(
            // The page surface is owned by PageContent; keep this as a simple section.
            "relative overflow-hidden rounded-lg border border-neutral-100 bg-white",
            showPaywall &&
              "pointer-events-none [mask-image:linear-gradient(#0006,#0006_25%,transparent_40%)]",
          )}
        >
          {view === "timeseries" && (
            <MixedAnalyticsChart demo={showPaywall} />
          )}
          {/* {view === "funnel" && <AnalyticsFunnelChart demo={showPaywall} />} */}
        </div>
        {showPaywall && <ConversionTrackingPaywall />}
      </div>
    </div>
  );
}

function ConversionTrackingPaywall() {
  const { workspace } = useContext(AnalyticsContext);
  const { slug } = workspace || {};

  return (
    <div className="animate-slide-up-fade pointer-events-none absolute inset-0 flex items-center justify-center pt-24">
      <div className="pointer-events-auto flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white">
          <Coins className="size-6 text-neutral-800" />
        </div>
        <h2 className="mt-7 text-base font-semibold text-neutral-700">
          Real-time Sales tracking
        </h2>
        <p className="mt-4 max-w-sm text-center text-sm text-neutral-500">
          Want to see your sales in realtime ?{" "}
          <a
            href="https://pimms.io/guides/how-to-track-conversions-on-vibe-coding-ai-no-code-sites"
            target="_blank"
            className="font-medium underline underline-offset-4 hover:text-black"
          >
            Learn more
          </a>
        </p>
        <AppButtonLink href={`/${slug}/upgrade`} variant="primary" size="sm" className="mt-4">
          Upgrade to Pro
        </AppButtonLink>
      </div>
    </div>
  );
}
