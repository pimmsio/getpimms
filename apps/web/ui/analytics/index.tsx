"use client";
import { cn } from "@dub/utils";
/* 
  This Analytics component lives in several different places:
  1. Workspace analytics page, e.g. app.dub.co/dub/analytics
  2. Public stats page, e.g. app.dub.co/share/dash_6NSA6vNm017MZwfzt8SubNSZ
  3. Partner program links page, e.g. partners.pimms.io/programs/dub/links/analytics
*/

import { useContext } from "react";
import AnalyticsProvider, {
  AnalyticsContext,
  AnalyticsDashboardProps,
} from "./analytics-provider";
import Channel from "./channel";
import DestinationUrls from "./destination-urls";
import Devices from "./devices";
import Locations from "./locations";
import Main from "./main";
import Toggle from "./toggle";
import TopLinks from "./top-links";
import UTMDetector from "./utm-detector";

export default function Analytics({
  adminPage,
  dashboardProps,
}: {
  adminPage?: boolean;
  dashboardProps?: AnalyticsDashboardProps;
}) {
  return (
    <AnalyticsProvider {...{ adminPage, dashboardProps }}>
      <AnalyticsContext.Consumer>
        {({ dashboardProps }) => {
          return (
            <div
              className={cn(
                "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-16",
                dashboardProps &&
                  "bg-gradient-to-br from-neutral-50 to-neutral-100/50 pt-10",
              )}
            >
              <div className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/90 shadow-sm backdrop-blur-lg">
                <Toggle />
              </div>
              <div className="mx-auto max-w-screen-xl px-2 pt-4 sm:px-4 sm:pt-6 lg:px-8">
                <div className="space-y-4 sm:space-y-6">
                  <Main />
                  <StatsGrid />
                </div>
              </div>
            </div>
          );
        }}
      </AnalyticsContext.Consumer>
    </AnalyticsProvider>
  );
}

function StatsGrid() {
  const { dashboardProps, selectedTab, view, workspace, adminPage } =
    useContext(AnalyticsContext);
  const { plan } = workspace || {};

  const hide =
    (selectedTab === "leads" || selectedTab === "sales" || view === "funnel") &&
    plan === "free";

  return hide ? null : (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Channel />

      {!dashboardProps && <TopLinks />}

      <UTMDetector />

      <DestinationUrls />

      <Locations />

      <Devices />
    </div>
  );
}
