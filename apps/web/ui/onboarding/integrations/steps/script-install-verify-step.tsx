"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ScriptCheckDetails = {
  scriptFound: boolean;
  injectFormFound: boolean;
  exposeFound: boolean;
  outboundDomains: string[];
  thankYouFound: boolean;
  forwardAllFound: boolean;
};

type ScriptCheckResponse = {
  detected: boolean;
  error: string | null;
  details: ScriptCheckDetails | null;
};

function StatusIcon({ value, severity = "error" }: { value: boolean | null; severity?: "error" | "warn" }) {
  if (value === null) {
    return <div className="size-4 rounded-full border-2 border-neutral-200" />;
  }
  if (value) {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }
  return severity === "warn" ? (
    <AlertTriangle className="size-4 text-amber-500" />
  ) : (
    <XCircle className="size-4 text-red-400" />
  );
}

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
  required: { detection: boolean; injectForm?: boolean | "info"; expose?: boolean | "info"; outbound?: string; thankYou?: boolean | "info"; forwardAll?: boolean | "info" };
  initialUrlPlaceholder?: string;
  autoVerify?: boolean;
  autoVerifyIntervalMs?: number;
  onNext: () => void;
}) {
  const { id: workspaceId } = useWorkspace();
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
      if (workspaceId) params.set("workspaceId", workspaceId);
      params.set("url", value);
      if (required.injectForm === true) params.set("requireInjectForm", "1");
      if (required.expose === true) params.set("requireExpose", "1");
      if (required.outbound) params.set("requireOutbound", required.outbound);
      if (required.thankYou === true) params.set("requireThankYou", "1");
      if (required.forwardAll === true) params.set("requireForwardAll", "1");

      const res = await fetch(`/api/onboarding/script-check?${params.toString()}`);
      const data = (await res.json()) as any;
      setResult({
        detected: Boolean(data?.detected),
        error: typeof data?.error === "string" ? data.error : null,
        details: data?.details ?? null,
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [onNext, required.expose, required.forwardAll, required.injectForm, required.outbound, required.thankYou, requirementsMet, url]);

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

  const checks = useMemo(() => {
    const items: { label: string; value: boolean | null; severity: "error" | "warn" }[] = [];
    const d = result?.details;

    items.push({
      label: "Detection script",
      value: d ? d.scriptFound : null,
      severity: "error",
    });

    if (required.injectForm) {
      const isInfo = required.injectForm === "info";
      items.push({
        label: isInfo ? "Form injection script (recommended)" : "Form injection script",
        value: d ? d.injectFormFound : null,
        severity: isInfo ? "warn" : "error",
      });
    }

    if (required.expose) {
      const isInfo = required.expose === "info";
      items.push({
        label: isInfo ? "Expose script (recommended)" : "Expose script",
        value: d ? d.exposeFound : null,
        severity: isInfo ? "warn" : "error",
      });
    }

    if (required.outbound) {
      items.push({
        label: `Outbound domain (${required.outbound})`,
        value: d ? d.outboundDomains.includes(required.outbound) : null,
        severity: "error",
      });
    }

    if (required.thankYou) {
      const isInfo = required.thankYou === "info";
      items.push({
        label: isInfo ? "Thank-you tracking (recommended)" : "Thank-you tracking",
        value: d ? d.thankYouFound : null,
        severity: isInfo ? "warn" : "error",
      });
    }

    if (required.forwardAll) {
      const isInfo = required.forwardAll === "info";
      items.push({
        label: isInfo ? "Forward all links (recommended)" : "Forward all links",
        value: d ? d.forwardAllFound : null,
        severity: isInfo ? "warn" : "error",
      });
    }

    return items;
  }, [required.expose, required.forwardAll, required.injectForm, required.outbound, required.thankYou, result?.details]);

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

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100 px-4">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="text-sm font-medium text-neutral-900">
              {check.label}
            </div>
            <div className="shrink-0">
              <StatusIcon value={check.value} severity={check.severity} />
            </div>
          </div>
        ))}
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
