"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useIntegrations from "@/lib/swr/use-integrations";
import useWorkspace from "@/lib/swr/use-workspace";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { CopyField } from "@/ui/onboarding/integrations/components/copy-field";
import { useAvailableDomains } from "@/ui/links/use-available-domains";
import { canonicalizeProviderId, canonicalizeProviderIds } from "@/ui/onboarding/canonical-provider-id";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useSavedThankYouLink } from "@/ui/onboarding/integrations/use-saved-thank-you-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { cn, nanoid } from "@dub/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PODIA_GUIDE_URL =
  "https://pimms.io/guides/how-to-track-podia-stripe-payments";

const PODIA_SCRIPT_BASE = "https://assets.pimms.io/detect-podia.min.v1.0.1.js";

export function PodiaOnboardingWizard({
  guideThumbnail,
  onContinueToStripe,
}: {
  guideThumbnail?: string | null;
  onContinueToStripe: () => void;
}) {
  const { id: workspaceId } = useWorkspace();
  const { integrations } = useIntegrations();
  const {
    providerIds,
    setProviderIds,
    completedProviderIds,
    setCompletedProviderIds,
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

  const [destinationUrl, setDestinationUrl] = useState("");
  const [creatingThankYou, setCreatingThankYou] = useState(false);
  const [createThankYouError, setCreateThankYouError] = useState<string | null>(null);
  const [thankYouLink, setThankYouLink] = useState<{
    id: string;
    shortLink: string;
    key: string;
  } | null>(null);

  const [scriptDone, setScriptDone] = useState(false);

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

  const {
    url: checkoutUrl,
    setUrl: setCheckoutUrl,
    creating: creatingTest,
    error: createTestError,
    created: createdTestLink,
    create: createTestLink,
  } = useCreateOnboardingTestLink({ workspaceId, domain: trackingDomain });

  const { waiting, done, start: startWaitingForSale } = useWaitForLinkLead({
    workspaceId,
    linkId: createdTestLink?.id,
    metric: "sales",
    min: 1,
  });

  // Mark Podia complete once a sale is detected.
  useEffect(() => {
    if (!done) return;
    const canonical = canonicalizeProviderId("podia");
    const has = completedProviderIds.some(
      (id) => canonicalizeProviderId(id) === canonical,
    );
    if (has) return;
    void setCompletedProviderIds([...completedProviderIds, canonical]);
  }, [completedProviderIds, done, setCompletedProviderIds]);

  const createThankYou = useCallback(async () => {
    setCreateThankYouError(null);
    if (!workspaceId) {
      setCreateThankYouError("Missing workspace ID.");
      return;
    }
    if (!trackingDomain) {
      setCreateThankYouError("Please select a domain.");
      return;
    }
    const dest = destinationUrl.trim();
    if (!dest) {
      setCreateThankYouError("Please paste your thank-you page destination URL.");
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
  }, [destinationUrl, persistSavedThankYou, trackingDomain, workspaceId]);

  const clearSavedAndRegenerate = useCallback(() => {
    setThankYouLink(null);
    setScriptDone(false);
    void clearSavedThankYou();
  }, [clearSavedThankYou]);

  const podiaScript = useMemo(() => {
    if (!thankYouLink?.shortLink) return "";
    return `<script src="${PODIA_SCRIPT_BASE}?url=${encodeURIComponent(
      thankYouLink.shortLink,
    )}" async></script>`;
  }, [thankYouLink?.shortLink]);

  const stripeReady = useMemo(() => {
    const selected = canonicalizeProviderIds(providerIds || []).includes("stripe");
    const installed =
      Array.isArray(integrations) &&
      integrations.some((i) => String(i.slug) === "stripe");
    return installed || selected;
  }, [integrations, providerIds]);

  const completed = useMemo(
    () => [stripeReady, Boolean(thankYouLink), scriptDone, Boolean(createdTestLink), done],
    [createdTestLink, done, scriptDone, stripeReady, thankYouLink],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0, stepsCount: 5 });

  const steps = useMemo(() => {
    return [
      {
        id: "podia-step-1",
        title: "Connect Stripe",
        isComplete: stripeReady,
        content: (
          <StepCard
            title="Connect Stripe"
            description="Podia payments are processed by Stripe. Connect Stripe so Pimms can record purchases with attribution."
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
        title: "Create thank-you link",
        isComplete: Boolean(thankYouLink),
        content: (
          <StepCard
            title="Create your Pimms thank-you link"
            description="This is the tracking link Podia will call after checkout."
          >
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  1. Choose the domain of your Pimms thank-you link
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

            {createThankYouError ? (
              <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {createThankYouError}
              </div>
            ) : null}

            {thankYouLink ? (
              <div className="mt-5 space-y-3">
                <CopyField label="Pimms thank-you link" value={thankYouLink.shortLink} />
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
                  onClick={() => void createThankYou()}
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
                    "Generate thank-you link"
                  )}
                </button>
              </div>
            )}
          </StepCard>
        ),
      },
      {
        id: "podia-step-3",
        title: "Install Podia script",
        isComplete: scriptDone,
        content: (
          <InstallScriptStep
            title="Add the Podia tracking script"
            description="In Podia → Settings → Analytics → Third-party code → Website tracking code."
            scripts={[
              {
                label: "Podia script",
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
        title: "Create test link",
        isComplete: Boolean(createdTestLink),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your Podia checkout / sales page URL. We’ll create a test short link."
            urlValue={checkoutUrl}
            urlPlaceholder="https://your-site.podia.com/..."
            onChangeUrl={setCheckoutUrl}
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
              startWaitingForSale();
            }}
          />
        ),
      },
      {
        id: "podia-step-5",
        title: "Verify tracking",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Verify tracking works"
            description="Open the test link and complete a test purchase in Podia. We’ll wait for the sale."
            linkHref={createdTestLink?.shortLink ?? null}
            canStart={Boolean(createdTestLink?.id)}
            waiting={waiting}
            done={done}
            onStartWaiting={startWaitingForSale}
            waitingLabel="Waiting for sale…"
            successLabel="Sale recorded. Tracking works."
          />
        ),
      },
    ];
  }, [
    checkoutUrl,
    clearSavedAndRegenerate,
    createTestError,
    createTestLink,
    createThankYou,
    createThankYouError,
    createdTestLink,
    creatingTest,
    creatingThankYou,
    destinationUrl,
    done,
    domains,
    loadingSaved,
    integrations,
    onContinueToStripe,
    podiaScript,
    providerIds,
    scriptDone,
    savedThankYou,
    setCheckoutUrl,
    setProviderIds,
    startWaitingForSale,
    stripeReady,
    thankYouLink,
    trackingDomain,
    waiting,
    wizard,
    workspaceId,
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

