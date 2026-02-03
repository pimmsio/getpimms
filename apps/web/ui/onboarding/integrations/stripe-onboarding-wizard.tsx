"use client";

import useIntegrations from "@/lib/swr/use-integrations";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useWorkspace from "@/lib/swr/use-workspace";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { AppButton } from "@/ui/components/controls/app-button";
import { BlurImage } from "@dub/ui";
import { ConnectedDots } from "@dub/ui/icons";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function StripeOnboardingWizard({
  guideThumbnail,
  setupGuideThumbnail,
  checkoutGuideThumbnail,
  setupGuideHref,
  checkoutGuideHref,
  providerId = "stripe",
}: {
  guideThumbnail?: string | null;
  setupGuideThumbnail?: string | null;
  checkoutGuideThumbnail?: string | null;
  setupGuideHref: string;
  checkoutGuideHref: string;
  providerId?: string;
}) {
  const { id: workspaceId, slug } = useWorkspace();
  const { integrations } = useIntegrations();
  const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
    useOnboardingPreferences();

  const stripeInstalled = Boolean(
    integrations?.some((i) => String(i.slug) === "stripe"),
  );

  const {
    url: paymentLinkUrl,
    setUrl: setPaymentLinkUrl,
    creating,
    error: createError,
    created,
    create: createTestLink,
  } = useCreateOnboardingTestLink({ workspaceId });

  const { waiting, done, start: startWaitingForSale } = useWaitForLinkLead({
    workspaceId,
    linkId: created?.id,
    metric: "sales",
    min: 1,
  });

  // Persist completion once a sale is detected.
  useEffect(() => {
    if (!done) return;
    if (completedProviderIds.includes(providerId)) return;
    void setCompletedProviderIds([...completedProviderIds, providerId]);
  }, [completedProviderIds, done, providerId, setCompletedProviderIds]);

  useEffect(() => {
    if (!stripeInstalled) return;
    void markProviderStarted(providerId);
  }, [markProviderStarted, providerId, stripeInstalled]);

  const completed = useMemo(
    () => [stripeInstalled, Boolean(created), done],
    [stripeInstalled, created, done],
  );
  const OPTIONAL_STEP_INDEX = 3;
  const STEPS_COUNT = 4;
  const { activeStepIndex, maxReachableStepIndex, goTo, forceGoTo } = useLinearWizard({
    completed,
    initialStepIndex: 0,
    stepsCount: STEPS_COUNT,
    isIndexAlwaysReachable: (idx) => idx === OPTIONAL_STEP_INDEX,
  });

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // When Stripe becomes connected (async), auto-advance to next step.
  useEffect(() => {
    if (!stripeInstalled) return;
    if (activeStepIndex !== 0) return;
    forceGoTo(1);
  }, [activeStepIndex, forceGoTo, stripeInstalled]);

  const startConnectFlow = useCallback(
    async (testMode = false) => {
      if (!workspaceId) return;
      setConnectError(null);
      setConnecting(true);
      try {
        const params = new URLSearchParams({
          workspaceId,
          integrationSlug: "stripe",
        });
        if (testMode) params.set("test", "1");
        const res = await fetch(
          `/api/onboarding/integration-install-url?${params.toString()}`,
          { method: "GET" },
        );
        const data = res.ok ? ((await res.json()) as any) : null;
        const installUrl =
          typeof data?.installUrl === "string" ? data.installUrl : null;
        if (installUrl) {
          window.location.href = installUrl;
          return;
        }

        // Fallback: bring user to the integrations page where they can enable Stripe.
        if (slug) {
          window.location.href = `/${slug}/settings/integrations/stripe`;
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
    },
    [slug, workspaceId],
  );

  const steps = useMemo(() => {
    return [
      {
        id: "stripe-step-1",
        title: "Connect Stripe",
        isComplete: stripeInstalled,
        content: (
          <div className="space-y-3">
            <ManualConfirmStep
              title="Connect your Stripe account"
              description="Click the button to enable the Stripe integration for this workspace."
              isDone={stripeInstalled}
              showConfirmButton={false}
              onConfirm={() => {}}
              actions={
                <div className="flex items-center gap-x-4">
                  {stripeInstalled ? (
                    <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="size-4" />
                      Connected
                    </div>
                  ) : (
                    <>
                      <AppButton
                        type="button"
                        onClick={() => void startConnectFlow(false)}
                        loading={connecting}
                        variant="primary"
                        className="flex gap-2"
                        icon={<ConnectedDots className="size-4" />}
                      >
                        Connect Stripe
                      </AppButton>
                      <AppButton
                        type="button"
                        onClick={() => void startConnectFlow(true)}
                        loading={connecting}
                        variant="secondary"
                        className="flex gap-2"
                        icon={<ConnectedDots className="size-4" />}
                      >
                        Connect Stripe (Test)
                      </AppButton>
                    </>
                  )}
                </div>
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
        id: "stripe-step-2",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="First create a Stripe Payment Link, then paste it here. We’ll create a test short link. Make a test purchase using the link."
            info="This payment link is only for testing. You can delete it afterwards if needed."
            urlValue={paymentLinkUrl}
            urlPlaceholder="https://buy.stripe.com/..."
            onChangeUrl={setPaymentLinkUrl}
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
              startWaitingForSale();
            }}
          />
        ),
      },
      {
        id: "stripe-step-3",
        title: "Verify tracking works",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Make a test purchase"
            description="Open your test link in an incognito tab and complete a test purchase."
            linkHref={created?.shortLink ?? null}
            canStart={Boolean(created?.id)}
            waiting={waiting}
            done={done}
            onStartWaiting={startWaitingForSale}
            waitingLabel="Waiting for sale…"
            successLabel="Sale recorded. Tracking works."
          />
        ),
      },
      {
        id: "stripe-step-optional",
        title: "Setup on a website (optional)",
        isComplete: true,
        isOptional: true,
        content: (
          <StepCard
            title="Setup on a website (optional)"
            description="Use these guides if you’re embedding Stripe on your site or using Stripe Checkout."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Stripe setup (website)",
                  href: setupGuideHref,
                  thumbnail: setupGuideThumbnail ?? guideThumbnail ?? null,
                },
                {
                  title: "Stripe Checkout (developer)",
                  href: checkoutGuideHref,
                  thumbnail: checkoutGuideThumbnail ?? guideThumbnail ?? null,
                },
              ].map((g) => (
                <a
                  key={g.href}
                  href={g.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col items-center rounded bg-neutral-200/40 pt-6 pb-4 transition-colors duration-100 hover:bg-neutral-200/60"
                >
                  <div className="flex w-full justify-center px-6">
                    {g.thumbnail ? (
                      <BlurImage
                        src={g.thumbnail}
                        alt={`${g.title} thumbnail`}
                        className="aspect-1200/630 w-full max-w-[260px] rounded bg-neutral-800 object-cover"
                        width={1200}
                        height={630}
                      />
                    ) : (
                      <div className="aspect-video w-full max-w-[260px] rounded bg-neutral-200" />
                    )}
                  </div>
                  <span className="mt-4 flex items-center gap-2 px-2 text-left text-[0.8125rem] font-medium text-neutral-800">
                    <BookOpen className="size-4" />
                    {g.title}
                  </span>
                </a>
              ))}
            </div>
          </StepCard>
        ),
      },
    ];
  }, [
    checkoutGuideHref,
    connectError,
    connecting,
    createError,
    createTestLink,
    created,
    creating,
    done,
    forceGoTo,
    paymentLinkUrl,
    setPaymentLinkUrl,
    setupGuideHref,
    startConnectFlow,
    startWaitingForSale,
    stripeInstalled,
    waiting,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Stripe setup"
      subtitle="Connect Stripe, then validate tracking with a test purchase."
      contentTop={
        activeStepIndex === OPTIONAL_STEP_INDEX ? null : (
          <GuideCard
            title="Stripe guide"
            href={setupGuideHref}
            thumbnail={guideThumbnail ?? null}
          />
        )
      }
      steps={steps}
      currentStepIndex={activeStepIndex}
      maxSelectableStepIndex={maxReachableStepIndex}
      onSelectStep={(idx) => {
        // Optional steps should be accessible from anywhere.
        if (steps[idx]?.isOptional) {
          forceGoTo(idx);
          return;
        }
        goTo(idx);
      }}
    />
  );
}

