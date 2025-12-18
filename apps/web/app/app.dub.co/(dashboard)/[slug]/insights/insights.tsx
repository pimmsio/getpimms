"use client";

import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import { LinksDisplayProvider } from "@/ui/links/links-display-provider";
import Toggle from "@/ui/analytics/toggle";
import useWorkspace from "@/lib/swr/use-workspace";
import EmptyState from "@/ui/shared/empty-state";
import { cn } from "@dub/utils";
import { CoinsIcon, TargetIcon } from "lucide-react";
import InsightsTable from "./insights-table";

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
      <LinksDisplayProvider>
        <div className="pb-10">
          {/* Page surface is owned by PageContent; keep this header calm and not “double-tinted”. */}
          <div className={cn("border-b border-neutral-100", "bg-white/85 backdrop-blur-sm")}>
            <Toggle page="links" />
          </div>
          <div className="py-4">
            <InsightsTableContainer />
          </div>
        </div>
      </LinksDisplayProvider>
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
        <div className="rounded-lg bg-neutral-50/60 p-4">
          <EmptyState
            icon={selectedTab === "sales" ? CoinsIcon : TargetIcon}
            title={
              selectedTab === "sales"
                ? "Real-time Sales tracking"
                : "Real-time Leads tracking"
            }
            description={`Want to see your ${selectedTab === "sales" ? "sales" : "leads"} in realtime ?`}
            learnMore="https://pimms.io/guides/how-to-track-conversions-on-vibe-coding-ai-no-code-sites"
            buttonText="Upgrade to Pro"
            buttonLink={`/${slug}/upgrade`}
          />
        </div>
      }
    />
  );
}
