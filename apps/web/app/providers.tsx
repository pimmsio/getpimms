"use client";

import {
  KeyboardShortcutProvider,
  TooltipProvider,
  useRemoveGAParams,
} from "@dub/ui";
import { Analytics as PimmsAnalytics } from "@getpimms/analytics/react";
import { AnalyticsCacheProvider } from "@/lib/swr/analytics-cache-provider";
import { useWorkspaceSlug } from "../lib/hooks/use-workspace-slug";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootProviders({ children }: { children: ReactNode }) {
  useRemoveGAParams();
  const workspaceSlug = useWorkspaceSlug() as string;

  return (
    <TooltipProvider>
      <KeyboardShortcutProvider>
        <Toaster closeButton className="pointer-events-auto" />
        <AnalyticsCacheProvider workspaceSlug={workspaceSlug}>
          {children}
        </AnalyticsCacheProvider>
        {/* <DubAnalytics
            apiHost="/_proxy/dub"
            cookieOptions={{
              domain: process.env.VERCEL === "1" ? ".dub.co" : "localhost",
            }}
            domainsConfig={{
              refer: "refer.pimms.io",
            }}
          /> */}
        <PimmsAnalytics
          cookieOptions={{
            domain: ".pimms.io",
          }}
        />
      </KeyboardShortcutProvider>
    </TooltipProvider>
  );
}
