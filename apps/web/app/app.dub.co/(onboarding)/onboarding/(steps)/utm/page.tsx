"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useWorkspace from "@/lib/swr/use-workspace";

export default function UtmStepPage() {
  const router = useRouter();
  const { slug: workspaceSlug } = useWorkspace();

  useEffect(() => {
    if (workspaceSlug) {
      router.replace(`/${workspaceSlug}?onboarding=utm`);
    } else {
      router.replace("/onboarding");
    }
  }, [router, workspaceSlug]);

  return null;
}


