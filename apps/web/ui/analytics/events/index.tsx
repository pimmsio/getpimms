"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import EmptyState from "@/ui/shared/empty-state";
import { Menu3 } from "@dub/ui/icons";
import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";
import EventsTabs from "./events-tabs";
import { CoinsIcon, TargetIcon } from "lucide-react";

export default function AnalyticsEvents({
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
        <Toggle page="events" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-3 lg:px-10">
          {/* <EventsTabs /> */}
          <EventsTableContainer />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

function EventsTableContainer() {
  const { selectedTab } = useContext(AnalyticsContext);
  const { plan, slug } = useWorkspace();

  const requiresUpgrade = plan === "free" && selectedTab === "sales";

  return (
    <EventsTable
      key={selectedTab}
      requiresUpgrade={requiresUpgrade}
      upgradeOverlay={
        <EmptyState
          icon={selectedTab === "sales" ? CoinsIcon : TargetIcon}
          title={selectedTab === "sales" ? "Real-time Sales" : "Real-time Conversions"}
          description={`Want to see your ${selectedTab === "sales" ? "sales" : "conversions"} in realtime ?`}
          // learnMore="https://d.to/events"
          buttonText="Upgrade to Pro"
          buttonLink={`/${slug}/upgrade`}
        />
      }
    />
  );
}
