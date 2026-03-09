"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useIntegrations from "@/lib/swr/use-integrations";
import useWorkspace from "@/lib/swr/use-workspace";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { ScriptInstallVerifyStep } from "@/ui/onboarding/integrations/steps/script-install-verify-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { BlurImage } from "@dub/ui";
import { useAvailableDomains } from "@/ui/links/use-available-domains";
import { canonicalizeProviderIds } from "@/ui/onboarding/canonical-provider-id";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useSavedThankYouLink } from "@/ui/onboarding/integrations/use-saved-thank-you-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { cn, nanoid } from "@dub/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const PODIA_GUIDE_URL =
  "https://pimms.io/guides/how-to-track-podia-stripe-payments";

const DETECTION_SCRIPT_SRC = "https://cdn.pimms.io/analytics/script.detection.js";

export function PodiaOnboardingWizard({
  guideThumbnail,
  onContinueToStripe,
  providerId = "podia",
}: {
  guideThumbnail?: string | null;
  onContinueToStripe: () => void;
  providerId?: string;
}) {
  const { id: workspaceId } = useWorkspace();
  const { integrations } = useIntegrations();
  const {
    providerIds,
    setProviderIds,
    completedProviderIds,
    setCompletedProviderIds,
    markProviderStarted,
  } = useOnboardingPreferences();

  const [trackingDomain, setTrackingDomain] = useState("");
  const { domains, primaryDomain } = useAvailableDomains({
    currentDomain: trackingDomain || undefined,
  });
  useEffect(() => {
    if (trackingDomain) return;
    if (primaryDomain) setTrackingDomain(primaryDomain);
  }, [primaryDomain, trackingDomain]);

  const {
    loading: loadingSaved,
    saved: savedThankYou,
    persist: persistSavedThankYou,
    clear: clearSavedThankYou,
  } = useSavedThankYouLink({ workspaceId, providerKey: "podia" });

  const [creatingThankYou, setCreatingThankYou] = useState(false);
  const [createThankYouError, setCreateThankYouError] = useState<string | null>(null);
  const [thankYouLink, setThankYouLink] = useState<{
    id: string;
    shortLink: string;
    key: string;
  } | null>(null);

  const [scriptDone, setScriptDone] = useState(false);
  const [scriptVerified, setScriptVerified] = useState(false);
  const [requireAccountDone, setRequireAccountDone] = useState(false);

  useEffect(() => {
    if (!savedThankYou) return;
    setTrackingDomain(savedThankYou.domain);
    setThankYouLink({
      id: savedThankYou.linkId,
      key: savedThankYou.key,
      shortLink: savedThankYou.shortLink,
    });
  }, [savedThankYou]);

  const {
    url: checkoutUrl,
    setUrl: setCheckoutUrl,
    creating: creatingTest,
    error: createTestError,
    created: createdTestLink,
    create: createTestLink,
    reset: resetTestLink,
  } = useCreateOnboardingTestLink({ workspaceId, domain: trackingDomain });

  const { waiting, done } = useWaitForLinkLead({
    workspaceId,
    linkId: createdTestLink?.id,
    metric: "sales",
    min: 1,
  });

  // Mark Podia complete once a sale is detected.
  useEffect(() => {
    if (!done) return;
    if (completedProviderIds.includes(providerId)) return;
    void setCompletedProviderIds([...completedProviderIds, providerId]);
  }, [completedProviderIds, done, providerId, setCompletedProviderIds]);

  const createThankYou = useCallback(async () => {
    setCreateThankYouError(null);
    if (!workspaceId) {
      setCreateThankYouError("Missing workspace ID.");
      return;
    }
    if (!trackingDomain) {
      setCreateThankYouError("Missing tracking domain.");
      return;
    }

    setCreatingThankYou(true);
    try {
      const dest = "https://www.podia.com/";
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
            title: "Auto-generated Podia tracking (thank-you)",
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
      setThankYouLink({
        id: String(payload.id),
        shortLink: String(payload.shortLink),
        key: String(payload.key ?? key),
      });
      void persistSavedThankYou({
        linkId: String(payload.id),
        key: String(payload.key ?? key),
        shortLink: String(payload.shortLink),
        domain: trackingDomain,
        destinationUrl: dest,
      });
    } catch (e) {
      setCreateThankYouError(e instanceof Error ? e.message : "Failed to create the link.");
    } finally {
      setCreatingThankYou(false);
    }
  }, [persistSavedThankYou, trackingDomain, workspaceId]);

  const podiaScript = useMemo(() => {
    if (!thankYouLink?.shortLink) return "";
    const domains = JSON.stringify({ "thank-you": thankYouLink.shortLink });
    return `<script defer src="${DETECTION_SCRIPT_SRC}" data-domains='${domains}'></script>`;
  }, [thankYouLink?.shortLink]);

  const stripeReady = useMemo(() => {
    const selected = canonicalizeProviderIds(providerIds || []).includes("stripe");
    const installed =
      Array.isArray(integrations) &&
      integrations.some((i) => String(i.slug) === "stripe");
    return installed || selected;
  }, [integrations, providerIds]);

  useEffect(() => {
    if (!stripeReady) return;
    void markProviderStarted(providerId);
  }, [markProviderStarted, providerId, stripeReady]);

  const completed = useMemo(
    () => [
      stripeReady,
      Boolean(thankYouLink),
      scriptDone,
      scriptVerified,
      requireAccountDone,
      Boolean(createdTestLink),
      done,
    ],
    [createdTestLink, done, requireAccountDone, scriptDone, scriptVerified, stripeReady, thankYouLink],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0, stepsCount: 7 });

  // When Stripe is already connected, auto-advance past step 0.
  useEffect(() => {
    if (!stripeReady) return;
    if (wizard.activeStepIndex !== 0) return;
    wizard.forceGoTo(1);
  }, [stripeReady, wizard.activeStepIndex, wizard.forceGoTo]);

  const steps = useMemo(() => {
    return [
      {
        id: "podia-step-1",
        title: "Connect Stripe",
        isComplete: stripeReady,
        content: (
          <StepCard
            title="Connect Stripe"
            description="Podia uses Stripe for payments. Connect Stripe to track purchases."
          >
            <button
              type="button"
              className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              onClick={async () => {
                const next = canonicalizeProviderIds([...(providerIds || []), "stripe"]);
                await setProviderIds(next);
                onContinueToStripe();
              }}
              disabled={!workspaceId}
            >
              Open Stripe setup
            </button>
          </StepCard>
        ),
      },
      {
        id: "podia-step-2",
        title: "Pick a tracking domain",
        isComplete: Boolean(thankYouLink),
        content: (
          <StepCard
            title="Pick a tracking domain"
            description="Select the domain for the short link used by the Podia detection script."
          >
            <div className="space-y-3">
              <select
                value={trackingDomain}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === trackingDomain) return;
                  setTrackingDomain(next);
                  if (thankYouLink) {
                    setThankYouLink(null);
                    setScriptDone(false);
                    setScriptVerified(false);
                    setRequireAccountDone(false);
                    setCreateThankYouError(null);
                    resetTestLink();
                    void clearSavedThankYou();
                  }
                }}
                className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
                disabled={creatingThankYou}
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
                <div className="text-sm text-neutral-500">Loading saved setup…</div>
              ) : savedThankYou ? (
                <div className="text-sm text-neutral-500">
                  A tracking link is already saved for this workspace.
                </div>
              ) : null}
            </div>

            {createThankYouError ? (
              <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {createThankYouError}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              {!thankYouLink ? (
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto",
                    (creatingThankYou || !workspaceId || !trackingDomain) &&
                      "cursor-not-allowed opacity-60 hover:bg-neutral-900",
                  )}
                  onClick={() => void createThankYou()}
                  disabled={creatingThankYou || !workspaceId || !trackingDomain}
                >
                  {creatingThankYou ? "Generating…" : "Generate short link"}
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:ml-auto sm:w-auto"
                  onClick={() => wizard.advance()}
                >
                  Next
                </button>
              )}
            </div>
          </StepCard>
        ),
      },
      {
        id: "podia-step-3",
        title: "Install detection script",
        isComplete: scriptDone,
        content: (
          <InstallScriptStep
            title="Add the Pimms detection script"
            description="Copy this script into your Podia site: Settings → Website → Website tracking code."
            info={
              thankYouLink?.shortLink
                ? `Tracking uses this short link: ${thankYouLink.shortLink}`
                : "Tracking uses your generated short link."
            }
            scripts={[
              {
                label: "Detection script (with thank-you tracking)",
                value: podiaScript,
              },
            ]}
            isDone={scriptDone}
            confirmDisabled={!podiaScript}
            onConfirm={() => {
              setScriptDone(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "podia-step-4",
        title: "Verify script installation",
        isComplete: scriptVerified,
        content: (
          <ScriptInstallVerifyStep
            title="Verify script installation"
            description="Paste your Podia site URL to check the script is installed."
            required={{ detection: true, thankYou: true }}
            initialUrlPlaceholder="https://your-site.podia.com"
            autoVerify
            onNext={() => {
              setScriptVerified(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "podia-step-5",
        title: "Require account setup",
        isComplete: requireAccountDone,
        content: (
          <StepCard
            title="Enable 'Require account setup before checkout'"
            description="In your Podia product settings, enable this option so the buyer's email is captured before payment."
          >
            <div className="mt-1 overflow-hidden rounded-lg border border-neutral-200">
              <BlurImage
                src="/static/guides/podia-option-require-account-before-checkout.webp"
                alt="Podia option: Require account setup before checkout"
                className="w-full"
                width={800}
                height={400}
              />
            </div>

            <div className="mt-4 flex items-center">
              {requireAccountDone ? (
                <div className="sm:ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  Completed
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:ml-auto sm:w-auto"
                  onClick={() => {
                    setRequireAccountDone(true);
                    wizard.advance();
                  }}
                >
                  I&apos;ve done this
                </button>
              )}
            </div>
          </StepCard>
        ),
      },
      {
        id: "podia-step-6",
        title: "Create test link",
        isComplete: Boolean(createdTestLink),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description={
              createdTestLink
                ? "Test link ready. Open in an incognito tab and complete a purchase."
                : "Paste your Podia product or sales page URL."
            }
            urlValue={checkoutUrl}
            urlPlaceholder="https://your-site.podia.com/..."
            onChangeUrl={setCheckoutUrl}
            creating={creatingTest}
            error={createTestError}
            created={createdTestLink}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(6);
              } catch {
                // error already set by hook
              }
            }}
            onOpenCreated={() => {
              wizard.forceGoTo(6);
            }}
            onReset={resetTestLink}
          />
        ),
      },
      {
        id: "podia-step-7",
        title: "Verify tracking",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Verify tracking works"
            description="Complete a test purchase using the link above. We detect the sale automatically."
            linkHref={createdTestLink?.shortLink ?? null}
            canStart={Boolean(createdTestLink?.id)}
            waiting={waiting}
            done={done}
            waitingLabel="Waiting for sale…"
            successLabel="Sale recorded. Tracking works."
            warnings={[
              <strong key="email">Use a new email for each test.</strong>,
              "The purchase must be at least 1 EUR / 1 USD.",
            ]}
          />
        ),
      },
    ];
  }, [
    checkoutUrl,
    createThankYou,
    createTestError,
    createTestLink,
    createThankYouError,
    createdTestLink,
    creatingTest,
    creatingThankYou,
    done,
    domains,
    loadingSaved,
    onContinueToStripe,
    podiaScript,
    providerIds,
    requireAccountDone,
    resetTestLink,
    scriptDone,
    scriptVerified,
    savedThankYou,
    setCheckoutUrl,
    setProviderIds,
    stripeReady,
    thankYouLink,
    trackingDomain,
    waiting,
    wizard,
    workspaceId,
    clearSavedThankYou,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Podia setup"
      subtitle="Track Podia payments (Stripe) with attribution."
      contentTop={
        <GuideCard title="Podia guide" href={PODIA_GUIDE_URL} thumbnail={guideThumbnail ?? null} />
      }
      steps={steps}
      currentStepIndex={wizard.activeStepIndex}
      maxSelectableStepIndex={wizard.maxReachableStepIndex}
      onSelectStep={(idx) => wizard.goTo(idx)}
    />
  );
}
