"use client";

import { AnalyticsCacheProvider } from "@/lib/swr/analytics-cache-provider";
import useWorkspace from "@/lib/swr/use-workspace";
import { ReactNode } from "react";
import WorkspaceAuth from "./auth";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { slug } = useWorkspace();
  
  return (
    <WorkspaceAuth>
      <AnalyticsCacheProvider workspaceSlug={slug || "default"}>
        {children}
      </AnalyticsCacheProvider>
    </WorkspaceAuth>
  );
}
