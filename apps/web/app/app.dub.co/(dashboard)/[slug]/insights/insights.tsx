"use client";

import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import { LinksDisplayProvider } from "@/ui/links/links-display-provider";
import Toggle from "@/ui/analytics/toggle";
import { cn } from "@dub/utils";
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

  return (
    <InsightsTable
      key={selectedTab}
    />
  );
}
