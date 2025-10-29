import { EventType } from "@/lib/analytics/types";

import { buttonVariants } from "@dub/ui";
import { cn } from "@dub/utils";
import { Coins } from "lucide-react";
import Link from "next/link";
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
            "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
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
        <div className="flex size-16 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50">
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
        <Link
          href={`/${slug}/upgrade`}
          className={cn(
            buttonVariants({ variant: "primary" }),
            "mt-4 flex h-9 items-center justify-center rounded border px-4 text-sm",
          )}
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
