import { useCallback, useEffect, useRef, useState } from "react";

export function useWaitForLinkLead({
  workspaceId,
  linkId,
  metric = "leads",
  min = 1,
  pollIntervalMs = 2000,
}: {
  workspaceId: string | null | undefined;
  linkId: string | null | undefined;
  metric?: "leads" | "sales";
  min?: number;
  pollIntervalMs?: number;
}) {
  const [waiting, setWaiting] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!workspaceId || !linkId) return;
    if (done) return;
    setWaiting(true);
  }, [done, linkId, workspaceId]);

  const stop = useCallback(() => {
    setWaiting(false);
  }, []);

  useEffect(() => {
    if (!workspaceId || !linkId) return;
    if (!waiting) return;
    if (done) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/links/${encodeURIComponent(linkId)}?workspaceId=${encodeURIComponent(
            workspaceId,
          )}`,
          { method: "GET" },
        );
        if (res.ok) {
          const data = (await res.json()) as any;
          const count = Number(data?.[metric] ?? 0);
          if (Number.isFinite(count) && count >= min) {
            setDone(true);
            setWaiting(false);
            return;
          }
        }
      } catch {
        // ignore transient errors
      }

      timerRef.current = window.setTimeout(poll, pollIntervalMs);
    };

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [done, linkId, metric, min, pollIntervalMs, waiting, workspaceId]);

  return { waiting, done, start, stop };
}

