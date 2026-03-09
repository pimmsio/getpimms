"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedThankYouLink = {
  linkId: string;
  key: string;
  shortLink: string;
  domain: string;
  destinationUrl: string;
  savedAt: number;
};

export function useSavedThankYouLink({
  workspaceId,
  providerKey,
}: {
  workspaceId: string | null | undefined;
  providerKey: "brevo" | "podia";
}) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedThankYouLink | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/onboarding/${providerKey}/thank-you-link?workspaceId=${encodeURIComponent(
            workspaceId,
          )}`,
        );
        if (!res.ok) return;
        const payload = (await res.json().catch(() => null)) as any;
        const stored = payload?.thankYou as SavedThankYouLink | null | undefined;
        if (cancelled) return;
        setSaved(stored ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [providerKey, workspaceId]);

  const persist = useCallback(
    async (input: Omit<SavedThankYouLink, "savedAt">) => {
      if (!workspaceId) return null;
      const prev = saved;
      setSaved({ ...input, savedAt: Date.now() });
      try {
        const res = await fetch(
          `/api/onboarding/${providerKey}/thank-you-link?workspaceId=${encodeURIComponent(
            workspaceId,
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              linkId: input.linkId,
              key: input.key,
              shortLink: input.shortLink,
              domain: input.domain,
              destinationUrl: input.destinationUrl,
            }),
          },
        );
        if (!res.ok) {
          setSaved(prev);
          return null;
        }
        const payload = (await res.json().catch(() => null)) as any;
        const stored = payload?.thankYou as SavedThankYouLink | null | undefined;
        if (stored) setSaved(stored);
        return stored ?? null;
      } catch {
        setSaved(prev);
        return null;
      }
    },
    [providerKey, saved, workspaceId],
  );

  const clear = useCallback(async () => {
    if (!workspaceId) return;
    setSaved(null);
    try {
      await fetch(
        `/api/onboarding/${providerKey}/thank-you-link?workspaceId=${encodeURIComponent(
          workspaceId,
        )}`,
        { method: "DELETE" },
      );
    } catch {
      // ignore
    }
  }, [providerKey, workspaceId]);

  return { loading, saved, setSaved, persist, clear };
}
