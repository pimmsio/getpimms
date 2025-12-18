"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useWorkspace from "@/lib/swr/use-workspace";

export default function CompletePage() {
  const router = useRouter();
  const { slug: workspaceSlug } = useWorkspace();

  useEffect(() => {
    if (workspaceSlug) {
      // Redirect to dashboard with onboarding query param
      router.replace(`/${workspaceSlug}?onboarding=complete`);
    } else {
      // If no workspace, redirect to onboarding root
      router.replace("/onboarding");
    }
  }, [router, workspaceSlug]);

  return null;
}
