"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import EmptyState from "@/ui/shared/empty-state";
import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";
import { TargetIcon } from "lucide-react";

export default function AnalyticsEvents({
  staticDomain,
  staticUrl,
  adminPage,
  showTabs,
}: {
  staticDomain?: string;
  staticUrl?: string;
  adminPage?: boolean;
  showTabs?: boolean;
}) {
  return (
    <AnalyticsProvider {...{ staticDomain, staticUrl, adminPage }}>
      <div className="pb-10">
        <Toggle page="events" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-3 lg:px-10">
          <EventsTableContainer />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

function EventsTableContainer() {
  const { plan, slug } = useWorkspace();

  const requiresUpgrade = plan === "free";

  return (
    <EventsTable
      key="events"
      requiresUpgrade={requiresUpgrade}
      upgradeOverlay={
        <EmptyState
          icon={TargetIcon}
          title="Real-time Conversions tracking"
          description="Want to see your conversions in realtime?"
          learnMore="https://pimms.io/guides/how-to-track-conversions-on-vibe-coding-ai-no-code-sites"
          buttonText="Upgrade to Starter"
          buttonLink={`/${slug}/upgrade`}
        />
      }
    />
  );
}
