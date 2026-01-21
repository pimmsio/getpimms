"use client";

import { AnalyticsCacheProvider } from "@/lib/swr/analytics-cache-provider";
import useWorkspace from "@/lib/swr/use-workspace";
import { ModalProvider } from "@/ui/modals/modal-provider";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppLayoutProviders>{children}</AppLayoutProviders>
    </SessionProvider>
  );
}

function AppLayoutProviders({ children }: { children: ReactNode }) {
  const { slug } = useWorkspace();

  return (
    <AnalyticsCacheProvider workspaceSlug={slug || "default"}>
      <ModalProvider>{children}</ModalProvider>
    </AnalyticsCacheProvider>
  );
}
