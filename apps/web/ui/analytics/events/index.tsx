"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { buttonVariants, EmptyState } from "@dub/ui";
import { cn } from "@dub/utils";
import { TargetIcon } from "lucide-react";
import Link from "next/link";
import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";

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
          description="Your free plan tracks clicks only. Upgrade to Starter to track conversions in realtime."
        >
          <div className="flex items-center gap-3">
            <Link
              href="https://pim.ms/dAXN6jl"
              target="_blank"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "font-bold transition-all duration-300 hover:scale-105",
                "mt-4 flex h-9 items-center justify-center rounded border px-4 text-sm",
              )}
            >
              Book a demo call
            </Link>
            <Link
              href={`/${slug}/upgrade`}
              className={cn(
                buttonVariants(),
                "bg-gradient-to-r from-[#2fcdfa] to-[#3970ff] transition-all duration-300 hover:scale-105",
                "mt-4 flex h-9 items-center justify-center rounded border px-4 text-sm",
              )}
            >
              Upgrade to Pro
            </Link>
          </div>
        </EmptyState>
      }
    />
  );
}
