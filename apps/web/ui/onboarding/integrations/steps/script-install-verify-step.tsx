"use client";

import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ScriptCheckResponse = {
  detected: boolean;
  error: string | null;
};

export function ScriptInstallVerifyStep({
  title,
  description,
  required,
  initialUrlPlaceholder,
  autoVerify = false,
  autoVerifyIntervalMs = 8000,
  onNext,
}: {
  title: string;
  description?: string;
  required: { detection: boolean; injectForm?: boolean; expose?: boolean; outbound?: string };
  initialUrlPlaceholder?: string;
  autoVerify?: boolean;
  autoVerifyIntervalMs?: number;
  onNext: () => void;
}) {
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const [result, setResult] = useState<ScriptCheckResponse | null>(null);

  const requirementsMet = useMemo(() => {
    if (!result) return false;
    return Boolean(result.detected);
  }, [result]);

  const primaryLabel = requirementsMet ? "Next" : "Verify installation";

  const verify = useCallback(async () => {
    if (requirementsMet) {
      onNext();
      return;
    }

    const value = url.trim();
    if (!value) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const params = new URLSearchParams();
      params.set("url", value);
      if (required.injectForm) params.set("requireInjectForm", "1");
      if (required.expose) params.set("requireExpose", "1");
      if (required.outbound) params.set("requireOutbound", required.outbound);

      const res = await fetch(`/api/onboarding/script-check?${params.toString()}`);
      const data = (await res.json()) as any;
      setResult({
        detected: Boolean(data?.detected),
        error: typeof data?.error === "string" ? data.error : null,
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [onNext, required.expose, required.injectForm, required.outbound, requirementsMet, url]);

  // Periodic verification (opt-in). Uses checkingRef to avoid
  // tearing down / recreating the interval on every verify cycle.
  useEffect(() => {
    if (!autoVerify) return;
    if (requirementsMet) return;
    if (!url.trim()) return;

    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (checkingRef.current) return;
      await verify();
    };

    timer = window.setTimeout(() => void tick(), 600);
    const interval = window.setInterval(() => void tick(), autoVerifyIntervalMs);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [autoVerify, autoVerifyIntervalMs, requirementsMet, url, verify]);

  return (
    <StepCard title={title} description={description}>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={initialUrlPlaceholder ?? "https://your-site.com"}
        className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
      />

      {result?.error ? (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {result.error}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="text-sm font-medium text-neutral-900">Detected</div>
          <div className="shrink-0">
            {result === null ? (
              <div className="size-4 rounded-full border-2 border-neutral-200" />
            ) : result.detected ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <XCircle className="size-4 text-red-400" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center">
        <button
          type="button"
          className={cn(
            "ml-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto",
            (!url.trim() || checking) &&
              "cursor-not-allowed opacity-60 hover:bg-neutral-900",
          )}
          onClick={() => void verify()}
          disabled={!url.trim() || checking}
        >
          {checking ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying…
            </>
          ) : (
            primaryLabel
          )}
        </button>
      </div>
    </StepCard>
  );
}
