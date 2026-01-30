"use client";

import {
  createOnboardingTestLink,
  OnboardingTestLink,
} from "@/ui/onboarding/integrations/onboarding-test-link";
import { useCallback, useState } from "react";

export function useCreateOnboardingTestLink({
  workspaceId,
  domain,
  onCreated,
}: {
  workspaceId: string | null | undefined;
  domain?: string | null;
  onCreated?: (link: OnboardingTestLink) => void;
}) {
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<OnboardingTestLink | null>(null);

  const create = useCallback(async () => {
    setError(null);
    if (!workspaceId) throw new Error("Missing workspace ID.");
    setCreating(true);
    try {
      const link = await createOnboardingTestLink({
        workspaceId,
        url: url.trim(),
        ...(domain ? { domain } : {}),
      });
      setCreated(link);
      onCreated?.(link);
      return link;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create test link");
      throw e;
    } finally {
      setCreating(false);
    }
  }, [domain, onCreated, url, workspaceId]);

  return {
    url,
    setUrl,
    creating,
    error,
    created,
    setCreated,
    create,
  };
}

