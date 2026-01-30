"use client";

import useIntegrations from "@/lib/swr/use-integrations";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useWorkspace from "@/lib/swr/use-workspace";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const CALENDLY_GUIDE_URL =
  "https://pimms.io/guides/how-to-track-calendly-bookings-marketing-attribution";

async function fetchInstallUrl({
  workspaceId,
  integrationSlug,
}: {
  workspaceId: string;
  integrationSlug: string;
}) {
  const res = await fetch(
    `/api/onboarding/integration-install-url?workspaceId=${encodeURIComponent(
      workspaceId,
    )}&integrationSlug=${encodeURIComponent(integrationSlug)}`,
    { method: "GET" },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return typeof data?.installUrl === "string" ? data.installUrl : null;
}

export function CalendlyOnboardingWizard({
  guideThumbnail,
}: {
  guideThumbnail?: string | null;
}) {
  const { id: workspaceId, slug } = useWorkspace();
  const { integrations } = useIntegrations();
  const { completedProviderIds, setCompletedProviderIds } = useOnboardingPreferences();

  const calendlyInstalled = Boolean(
    integrations?.some((i) => String(i.slug) === "calendly"),
  );

  const {
    url: bookingUrl,
    setUrl: setBookingUrl,
    creating,
    error: createError,
    created,
    create: createTestLink,
  } = useCreateOnboardingTestLink({ workspaceId });

  const { waiting, done, start: startWaitingForLead } = useWaitForLinkLead({
    workspaceId,
    linkId: created?.id,
  });

  // Persist completion once a lead is detected.
  useEffect(() => {
    if (!done) return;
    if (completedProviderIds.includes("calendly")) return;
    void setCompletedProviderIds([...completedProviderIds, "calendly"]);
  }, [completedProviderIds, done, setCompletedProviderIds]);

  const completed = useMemo(
    () => [calendlyInstalled, Boolean(created), done],
    [calendlyInstalled, created, done],
  );
  const { activeStepIndex, maxReachableStepIndex, goTo, forceGoTo } = useLinearWizard({
    completed,
    initialStepIndex: 0,
  });

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // When Calendly becomes connected (async), auto-advance to next step.
  useEffect(() => {
    if (!calendlyInstalled) return;
    if (activeStepIndex !== 0) return;
    forceGoTo(1);
  }, [activeStepIndex, calendlyInstalled, forceGoTo]);

  const startConnectFlow = useCallback(async () => {
    if (!workspaceId) return;
    setConnectError(null);
    setConnecting(true);
    try {
      const installUrl = await fetchInstallUrl({
        workspaceId,
        integrationSlug: "calendly",
      });
      if (installUrl) {
        window.location.href = installUrl;
        return;
      }
      if (slug) {
        window.location.href = `/${slug}/settings/integrations/calendly`;
      } else {
        throw new Error("Missing workspace slug.");
      }
    } catch (e) {
      setConnectError(
        e instanceof Error ? e.message : "Failed to start the connection flow.",
      );
    } finally {
      setConnecting(false);
    }
  }, [slug, workspaceId]);

  const steps = useMemo(() => {
    return [
      {
        id: "calendly-step-1",
        title: "Connect Calendly",
        isComplete: calendlyInstalled,
        content: (
          <div className="space-y-3">
            <ManualConfirmStep
              title="Connect your Calendly account"
              description="Click the button to enable the integration in your workspace."
              isDone={calendlyInstalled}
              showConfirmButton={false}
              onConfirm={() => {}}
              actions={
                <button
                  type="button"
                  className={
                    calendlyInstalled
                      ? "inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                      : "inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  }
                  onClick={() => void startConnectFlow()}
                  disabled={connecting || calendlyInstalled}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Connecting…
                    </>
                  ) : calendlyInstalled ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Connected
                    </>
                  ) : (
                    "Connect Calendly"
                  )}
                </button>
              }
            />

            {connectError ? (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {connectError}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "calendly-step-2",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your Calendly booking URL. We’ll create a test short link."
            urlValue={bookingUrl}
            urlPlaceholder="https://calendly.com/your-name/30min"
            onChangeUrl={setBookingUrl}
            creating={creating}
            error={createError}
            created={created}
            onCreate={async () => {
              try {
                await createTestLink();
                forceGoTo(2);
              } catch {
                // error already set by hook
              }
            }}
            onOpenCreated={() => {
              forceGoTo(2);
              startWaitingForLead();
            }}
          />
        ),
      },
      {
        id: "calendly-step-3",
        title: "Verify tracking works",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Book a test meeting"
            description="Open your test link in an incognito tab and book a meeting with a fresh test email."
            linkHref={created?.shortLink ?? null}
            canStart={Boolean(created?.id)}
            waiting={waiting}
            done={done}
            onStartWaiting={startWaitingForLead}
          />
        ),
      },
    ];
  }, [
    bookingUrl,
    calendlyInstalled,
    connectError,
    connecting,
    createError,
    createTestLink,
    created,
    creating,
    done,
    forceGoTo,
    startConnectFlow,
    startWaitingForLead,
    waiting,
    setBookingUrl,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Calendly setup"
      subtitle="Connect Calendly, then validate tracking with a test booking."
      contentTop={
        <GuideCard
          title="Calendly guide"
          href={CALENDLY_GUIDE_URL}
          thumbnail={guideThumbnail ?? null}
        />
      }
      steps={steps}
      currentStepIndex={activeStepIndex}
      maxSelectableStepIndex={maxReachableStepIndex}
      onSelectStep={(idx) => goTo(idx)}
    />
  );
}

