"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useWorkspace from "@/lib/swr/use-workspace";
import { useAvailableDomains } from "@/ui/links/use-available-domains";
import { CopyField } from "@/ui/onboarding/integrations/components/copy-field";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { Brevo } from "@/ui/layout/sidebar/conversions/icons/brevo";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { useSavedThankYouLink } from "@/ui/onboarding/integrations/use-saved-thank-you-link";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { cn, nanoid } from "@dub/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const BREVO_GUIDE_URL =
  "https://pimms.io/guides/how-to-track-brevo-forms-and-meetings-webhook-integration";

// Public webhook endpoint (Brevo must reach it).
const BREVO_WEBHOOK_BASE = "https://api.pimms.io/webhook/brevo";

function buildBrevoWebhookUrl({
  workspaceId,
  type,
}: {
  workspaceId: string;
  type: "form" | "meeting";
}) {
  const params = new URLSearchParams();
  params.set("workspace_id", workspaceId);
  params.set("type", type);
  return `${BREVO_WEBHOOK_BASE}?${params.toString()}`;
}

export function BrevoOnboardingWizard({
  guideThumbnail,
  providerId = "brevoForm",
}: {
  guideThumbnail?: string | null;
  providerId?: string;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
    useOnboardingPreferences();

  const [step1Done, setStep1Done] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [trackingDomain, setTrackingDomain] = useState("");
  const [thankYouLink, setThankYouLink] = useState<{
    id: string;
    shortLink: string;
    key: string;
  } | null>(null);
  const [creatingThankYou, setCreatingThankYou] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    loading: loadingSaved,
    saved: savedThankYou,
    persist: persistSavedThankYou,
    clear: clearSavedThankYou,
  } = useSavedThankYouLink({ workspaceId, providerKey: "brevo" });

  const { domains, primaryDomain } = useAvailableDomains({
    currentDomain: trackingDomain || undefined,
  });

  useEffect(() => {
    if (trackingDomain) return;
    if (primaryDomain) setTrackingDomain(primaryDomain);
  }, [primaryDomain, trackingDomain]);

  useEffect(() => {
    if (!savedThankYou) return;
    setTrackingDomain(savedThankYou.domain);
    setDestinationUrl(savedThankYou.destinationUrl);
    setThankYouLink({
      id: savedThankYou.linkId,
      key: savedThankYou.key,
      shortLink: savedThankYou.shortLink,
    });
  }, [savedThankYou]);

  const webhookUrlForm = useMemo(() => {
    if (!workspaceId) return "";
    return buildBrevoWebhookUrl({ workspaceId, type: "form" });
  }, [workspaceId]);

  const webhookUrlMeeting = useMemo(() => {
    if (!workspaceId) return "";
    return buildBrevoWebhookUrl({ workspaceId, type: "meeting" });
  }, [workspaceId]);

  const authToken = workspaceId ?? "";

  const {
    url: brevoUrl,
    setUrl: setBrevoUrl,
    creating: creatingTest,
    error: createTestError,
    created: createdTestLink,
    setCreated: setCreatedTestLink,
    create: createTestLink,
  } = useCreateOnboardingTestLink({ workspaceId, domain: trackingDomain });

  const { waiting, done, start: startWaitingForLead } = useWaitForLinkLead({
    workspaceId,
    linkId: createdTestLink?.id,
  });

  // Persist completion only once verification succeeded.
  useEffect(() => {
    if (!done) return;
    if (completedProviderIds.includes(providerId)) return;
    void setCompletedProviderIds([...completedProviderIds, providerId]);
  }, [completedProviderIds, done, providerId, setCompletedProviderIds]);

  useEffect(() => {
    if (!step1Done) return;
    void markProviderStarted(providerId);
  }, [markProviderStarted, providerId, step1Done]);

  const createThankYouLink = useCallback(async () => {
    setCreateError(null);
    if (!workspaceId) {
      setCreateError("Missing workspace ID.");
      return;
    }
    if (!trackingDomain) {
      setCreateError("Please select a domain.");
      return;
    }
    const dest = destinationUrl.trim();
    if (!dest) {
      setCreateError("Please paste your thank-you page destination URL.");
      return;
    }

    setCreatingThankYou(true);
    try {
      const key = `${nanoid(8)}/thankyou`;
      const res = await fetch(
        `/api/links?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: dest,
            key,
            domain: trackingDomain,
            trackConversion: true,
            title: "Auto-generated Brevo tracking (thank-you)",
          }),
        },
      );
      const payload = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(payload?.error?.message || "Failed to create the link.");
      }
      if (!payload?.shortLink || !payload?.id) {
        throw new Error("Link created but response is invalid.");
      }

      const created = {
        id: String(payload.id),
        shortLink: String(payload.shortLink),
        key: String(payload.key ?? key),
      };

      setThankYouLink(created);
      void persistSavedThankYou({
        linkId: created.id,
        key: created.key,
        shortLink: created.shortLink,
        domain: trackingDomain,
        destinationUrl: dest,
      });
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create the link.");
    } finally {
      setCreatingThankYou(false);
    }
  }, [destinationUrl, persistSavedThankYou, trackingDomain, workspaceId]);

  const clearSavedAndRegenerate = useCallback(() => {
    setThankYouLink(null);
    setCreatedTestLink(null);
    void clearSavedThankYou();
  }, [clearSavedThankYou, setCreatedTestLink]);

  const completed = useMemo(
    () => [step1Done, Boolean(thankYouLink), Boolean(createdTestLink), done],
    [createdTestLink, done, step1Done, thankYouLink],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const steps = useMemo(() => {
    return [
      {
        id: "brevo-step-1",
        title: "Brevo webhook",
        isComplete: step1Done,
        content: (
          <StepCard
            title="Brevo webhook"
            description="Create two webhooks in Brevo: one for Forms and one for Meetings."
          >
            <div className="space-y-3">
              <CopyField
                label="Webhook URL (Forms)"
                value={webhookUrlForm}
                disabled={!webhookUrlForm}
              />
              <CopyField
                label="Webhook URL (Meetings)"
                value={webhookUrlMeeting}
                disabled={!webhookUrlMeeting}
              />
              <CopyField
                label="Authentication token (Bearer)"
                value={authToken}
                disabled={!authToken}
              />
            </div>

            <div className="mt-4 text-sm text-neutral-600">
              Enable only:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <span className="font-semibold text-neutral-900">Forms</span>: Form
                  submitted
                </li>
                <li>
                  <span className="font-semibold text-neutral-900">Meetings</span>:
                  Meeting booked
                </li>
              </ul>
            </div>

            <div className="mt-5 flex items-center">
              {step1Done ? (
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  Completed
                </div>
              ) : (
                <button
                  type="button"
                  className="ml-auto inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
                  onClick={() => {
                    setStep1Done(true);
                    wizard.advance();
                  }}
                  disabled={!workspaceId}
                >
                  Next
                </button>
              )}
            </div>
          </StepCard>
        ),
      },
      {
        id: "brevo-step-2",
        title: "Thank-you link",
        isComplete: Boolean(thankYouLink),
        content: (
          <StepCard
            title="Create a Brevo thank-you redirect link"
            description="Generate a short link and paste it into Brevo’s “Thank you URL”."
          >
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  1. Choose the domain of the link you will paste into Brevo
                </div>
                <select
                  value={trackingDomain}
                  onChange={(e) => setTrackingDomain(e.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
                  disabled={creatingThankYou || Boolean(thankYouLink)}
                >
                  <option value="" disabled>
                    Select a domain…
                  </option>
                  {domains.map((d: any) => (
                    <option key={String(d.slug)} value={String(d.slug)}>
                      {String(d.slug)}
                    </option>
                  ))}
                </select>
                {loadingSaved ? (
                  <div className="mt-2 text-sm text-neutral-500">Loading saved setup…</div>
                ) : savedThankYou ? (
                  <div className="mt-2 text-sm text-neutral-500">Saved for this workspace.</div>
                ) : null}
              </div>

              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  2. Set the destination URL (your real thank-you page)
                </div>
                <input
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://your-domain.com/thank-you"
                  className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
                  disabled={creatingThankYou || Boolean(thankYouLink)}
                />
              </div>
            </div>

            {createError ? (
              <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {createError}
              </div>
            ) : null}

            {thankYouLink ? (
              <div className="mt-5 space-y-3">
                <CopyField
                  label="Thank-you redirect link (paste into Brevo)"
                  value={thankYouLink.shortLink}
                />
                <div className="text-sm text-neutral-600">
                  Paste into Brevo’s{" "}
                  <span className="font-semibold text-neutral-900">Thank you URL</span>.
                </div>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 sm:w-auto"
                  onClick={clearSavedAndRegenerate}
                >
                  Generate a new link
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto",
                    (creatingThankYou ||
                      !destinationUrl.trim() ||
                      !workspaceId ||
                      !trackingDomain) &&
                      "cursor-not-allowed opacity-60 hover:bg-neutral-900",
                  )}
                  onClick={() => void createThankYouLink()}
                  disabled={
                    creatingThankYou ||
                    !destinationUrl.trim() ||
                    !workspaceId ||
                    !trackingDomain
                  }
                >
                  {creatingThankYou ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate thank you redirect link"
                  )}
                </button>
              </div>
            )}
          </StepCard>
        ),
      },
      {
        id: "brevo-step-3",
        title: "Test link",
        isComplete: Boolean(createdTestLink),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your Brevo form URL or Brevo meeting booking URL. We’ll create a test short link."
            urlValue={brevoUrl}
            urlPlaceholder="https://..."
            onChangeUrl={setBrevoUrl}
            creating={creatingTest}
            error={createTestError}
            created={createdTestLink}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(3);
              } catch {
                // error already set by hook
              }
            }}
            onOpenCreated={() => {
              wizard.forceGoTo(3);
              startWaitingForLead();
            }}
          />
        ),
      },
      {
        id: "brevo-step-4",
        title: "Verify",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Verify tracking works"
            description="Submit a Brevo form or book a Brevo meeting using the test link. We’ll wait for the lead."
            linkHref={createdTestLink?.shortLink ?? null}
            canStart={Boolean(createdTestLink?.id)}
            waiting={waiting}
            done={done}
            onStartWaiting={startWaitingForLead}
            waitingLabel="Waiting for lead…"
            successLabel="Lead recorded. Tracking works."
          />
        ),
      },
    ];
  }, [
    authToken,
    brevoUrl,
    clearSavedAndRegenerate,
    createError,
    createTestError,
    createTestLink,
    createThankYouLink,
    creatingTest,
    creatingThankYou,
    createdTestLink,
    destinationUrl,
    done,
    domains,
    loadingSaved,
    savedThankYou,
    setBrevoUrl,
    startWaitingForLead,
    step1Done,
    thankYouLink,
    trackingDomain,
    waiting,
    webhookUrlForm,
    webhookUrlMeeting,
    workspaceId,
    wizard,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Brevo setup"
      subtitle="Setup Brevo webhooks and a redirect link to attribute conversions."
      headerActions={<Brevo className="size-6" />}
      contentTop={
        <GuideCard title="Brevo guide" href={BREVO_GUIDE_URL} thumbnail={guideThumbnail ?? null} />
      }
      steps={steps}
      currentStepIndex={wizard.activeStepIndex}
      maxSelectableStepIndex={wizard.maxReachableStepIndex}
      onSelectStep={(idx) => wizard.goTo(idx)}
    />
  );
}

