"use client";

import { cn } from "@dub/utils";
import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import Toggle from "@/ui/analytics/toggle";
import InsightsTable from "./insights-table";
import useWorkspace from "@/lib/swr/use-workspace";
import EmptyState from "@/ui/shared/empty-state";
import { CoinsIcon, TargetIcon } from "lucide-react";

export default function Insights({
  staticDomain,
  staticUrl,
  adminPage,
}: {
  staticDomain?: string;
  staticUrl?: string;
  adminPage?: boolean;
}) {
  return (
    <AnalyticsProvider {...{ staticDomain, staticUrl, adminPage }}>
      <div className="pb-10">
        <Toggle page="analytics" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-3 lg:px-10">
          <InsightsTableContainer />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

function InsightsTableContainer() {
  const { selectedTab } = useContext(AnalyticsContext);
  const { plan, slug } = useWorkspace();

  const requiresUpgrade = (plan === "free" || plan === "starter") && selectedTab === "sales";

  return (
    <InsightsTable
      key={selectedTab}
      requiresUpgrade={requiresUpgrade}
      upgradeOverlay={
        <EmptyState
          icon={selectedTab === "sales" ? CoinsIcon : TargetIcon}
          title={selectedTab === "sales" ? "Real-time Sales tracking" : "Real-time Conversions tracking"}
          description={`Want to see your ${selectedTab === "sales" ? "sales" : "conversions"} in realtime ?`}
          learnMore="https://pimms.io/guides/how-to-track-conversions-on-vibe-coding-ai-no-code-sites"
          buttonText="Upgrade to Pro"
          buttonLink={`/${slug}/upgrade`}
        />
      }
    />
  );
}
