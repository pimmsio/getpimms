"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useEffect, useMemo, useState } from "react";

const GUIDE_BASE_URL = "https://pimms.io/guides/calcom-direct-webhook-integration";
const GUIDE_STEP_1_URL = `${GUIDE_BASE_URL}#1-add-the-pimms_id-field-to-your-calcom-form`;

export function CalcomOnboardingWizard({
  guideThumbnail,
}: {
  guideThumbnail?: string | null;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds } = useOnboardingPreferences();

  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  const {
    url: bookingUrl,
    setUrl: setBookingUrl,
    creating,
    error: createError,
    created,
    create: createTestLink,
  } = useCreateOnboardingTestLink({
    workspaceId,
  });

  const { waiting, done, start: startWaitingForLead } = useWaitForLinkLead({
    workspaceId,
    linkId: created?.id,
  });

  const webhookUrl = useMemo(() => {
    if (!workspaceId) return "";
    return `https://api.pimms.io/webhook/calcom?workspace_id=${encodeURIComponent(
      workspaceId,
    )}`;
  }, [workspaceId]);

  const secret = workspaceId || "";

  const validated = done;
  const validating = waiting;

  useEffect(() => {
    if (!validated) return;
    if (completedProviderIds.includes("calDotCom")) return;
    void setCompletedProviderIds([...completedProviderIds, "calDotCom"]);
  }, [completedProviderIds, setCompletedProviderIds, validated]);

  const completed = useMemo(
    () => [step1Done, step2Done, Boolean(created), validated],
    [created, step1Done, step2Done, validated],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const steps = useMemo(() => {
    return [
      {
        id: "calcom-step-1",
        title: "Edit your Cal.com forms",
        isComplete: step1Done,
        content: (
          <ManualConfirmStep
            title="Add the pimms_id field"
            description="Follow the guide step and add the field to your Cal.com booking questions."
            isDone={step1Done}
            onConfirm={() => {
              setStep1Done(true);
              // auto-advance immediately (state updates are async)
              wizard.advance();
            }}
            actions={
              <button
                type="button"
                className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                onClick={() => {
                  window.open(GUIDE_STEP_1_URL, "_blank", "noopener,noreferrer");
                }}
              >
                Open step 1 in guide
              </button>
            }
          />
        ),
      },
      {
        id: "calcom-step-2",
        title: "Set up the webhook in Cal.com",
        isComplete: step2Done,
        content: (
          <WebhookConfigStep
            title="Webhook configuration"
            description="Paste these values into Cal.com → Settings → Developer → Webhooks."
            fields={[
              { label: "Subscriber URL", value: webhookUrl, disabled: !webhookUrl },
              { label: "Secret", value: secret, disabled: !secret },
            ]}
            isDone={step2Done}
            confirmDisabled={!workspaceId}
            onConfirm={() => {
              setStep2Done(true);
              // auto-advance immediately (state updates are async)
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "calcom-step-3",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your booking URL. We’ll create a test short link."
            urlValue={bookingUrl}
            urlPlaceholder="https://cal.com/your-name/your-event"
            onChangeUrl={setBookingUrl}
            creating={creating}
            error={createError}
            created={created}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(3);
              } catch {
                // error is already set in the hook
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
        id: "calcom-step-4",
        title: "Verify the tracking works",
        isComplete: validated,
        content: (
          <WaitForLeadStep
            title="Book a test meeting"
            description='Open your test link and book a meeting with a test email. Use a different test email for each attempt.'
            linkHref={created?.shortLink ?? null}
            canStart={Boolean(created?.id)}
            waiting={validating}
            done={validated}
            onStartWaiting={startWaitingForLead}
          />
        ),
      },
    ];
  }, [
    bookingUrl,
    createError,
    created,
    createTestLink,
    creating,
    secret,
    step1Done,
    step2Done,
    validated,
    validating,
    webhookUrl,
    workspaceId,
    startWaitingForLead,
    wizard,
  ]);

  return (
    <>
      <IntegrationOnboardingWizard
        title="Cal.com setup"
        subtitle="Follow the steps to validate your Cal.com booking tracking."
        contentTop={
          <GuideCard
            title="Cal.com guide"
            href={GUIDE_BASE_URL}
            thumbnail={guideThumbnail ?? null}
          />
        }
        steps={steps}
        currentStepIndex={wizard.activeStepIndex}
        maxSelectableStepIndex={wizard.maxReachableStepIndex}
        onSelectStep={(idx) => {
          wizard.goTo(idx);
        }}
      />
    </>
  );
}

