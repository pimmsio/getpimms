"use client";

import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import { LinksDisplayProvider } from "@/ui/links/links-display-provider";
import Toggle from "@/ui/analytics/toggle";
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
          <Toggle page="links" />
          <div className="mx-auto flex w-full flex-col gap-3 px-3 lg:px-10">
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
