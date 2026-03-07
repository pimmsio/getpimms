"use client";

import {
  createOnboardingTestLink,
  OnboardingTestLink,
} from "@/ui/onboarding/integrations/onboarding-test-link";
import { useCallback, useRef, useState } from "react";

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
  const creatingRef = useRef(false);

  const create = useCallback(async () => {
    if (creatingRef.current) return;
    setError(null);
    if (!workspaceId) throw new Error("Missing workspace ID.");
    creatingRef.current = true;
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
      creatingRef.current = false;
      setCreating(false);
    }
  }, [domain, onCreated, url, workspaceId]);

  const reset = useCallback(() => {
    setCreated(null);
    setUrl("");
    setError(null);
  }, []);

  return {
    url,
    setUrl,
    creating,
    error,
    created,
    setCreated,
    create,
    reset,
  };
}

