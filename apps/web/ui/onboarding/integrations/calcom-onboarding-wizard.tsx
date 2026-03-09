"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { ScriptInstallVerifyStep } from "@/ui/onboarding/integrations/steps/script-install-verify-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useEffect, useMemo, useState } from "react";

const GUIDE_BASE_URL = "https://pimms.io/guides/calcom-direct-webhook-integration";
const GUIDE_STEP_1_URL = `${GUIDE_BASE_URL}#1-add-the-pimms_id-field-to-your-calcom-form`;

const CALCOM_DETECTION_SCRIPT =
  `<script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-domains='{"outbound":"cal.com"}'></script>`;

export function CalcomOnboardingWizard({
  guideThumbnail,
  providerId = "calDotCom",
}: {
  guideThumbnail?: string | null;
  providerId?: string;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
    useOnboardingPreferences();

  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [scriptVerified, setScriptVerified] = useState(false);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  const {
    url: bookingUrl,
    setUrl: setBookingUrl,
    creating,
    error: createError,
    created,
    create: createTestLink,
    reset: resetTestLink,
  } = useCreateOnboardingTestLink({
    workspaceId,
  });

  const { waiting, done } = useWaitForLinkLead({
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
    if (completedProviderIds.includes(providerId)) return;
    void setCompletedProviderIds([...completedProviderIds, providerId]);
  }, [completedProviderIds, providerId, setCompletedProviderIds, validated]);

  useEffect(() => {
    if (!scriptInstalled) return;
    void markProviderStarted(providerId);
  }, [markProviderStarted, providerId, scriptInstalled]);

  const completed = useMemo(
    () => [scriptInstalled, scriptVerified, step1Done, step2Done, Boolean(created), validated],
    [created, scriptInstalled, scriptVerified, step1Done, step2Done, validated],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const steps = useMemo(() => {
    return [
      {
        id: "calcom-step-1",
        title: "Install the script",
        isComplete: scriptInstalled,
        content: (
          <InstallScriptStep
            title="Add the Pimms script"
            description="Install the detection script on the page where your Cal.com booking is embedded. It auto-injects pimms_id into Cal.com embeds and links."
            scripts={[{ label: "Detection script (with Cal.com outbound)", value: CALCOM_DETECTION_SCRIPT }]}
            mergeNote={
              <>
                Already have the Pimms detection script from another integration? Update the existing{" "}
                <code className="font-mono text-xs">data-domains</code> attribute to include{" "}
                <code className="font-mono text-xs">cal.com</code> in the outbound list (e.g.{" "}
                <code className="font-mono text-xs">{`"outbound":"cal.com,tally.so"`}</code>) instead of adding a duplicate script tag.
              </>
            }
            isDone={scriptInstalled}
            confirmDisabled={!workspaceId}
            onConfirm={() => {
              setScriptInstalled(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "calcom-step-2",
        title: "Verify installation",
        isComplete: scriptVerified,
        content: (
          <ScriptInstallVerifyStep
            title="Verify the script is detected"
            description="Paste the URL of the page where your Cal.com booking is embedded. We'll check for the detection script and Cal.com outbound config."
            required={{ detection: true, outbound: "cal.com" }}
            initialUrlPlaceholder="your-site.com/page-with-calcom-booking"
            autoVerify
            onNext={() => {
              setScriptVerified(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "calcom-step-3",
        title: "Edit your Cal.com forms",
        isComplete: step1Done,
        content: (
          <ManualConfirmStep
            title="Add the pimms_id field"
            description="Follow the guide step and add the field to your Cal.com booking questions."
            isDone={step1Done}
            onConfirm={() => {
              setStep1Done(true);
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
                Open step in guide
              </button>
            }
          />
        ),
      },
      {
        id: "calcom-step-4",
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
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "calcom-step-5",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description={
              created
                ? "Test link ready. Open in an incognito tab and book a meeting."
                : "Paste the URL of your Cal.com booking page."
            }
            urlValue={bookingUrl}
            urlPlaceholder="https://cal.com/your-name/your-event"
            onChangeUrl={setBookingUrl}
            creating={creating}
            error={createError}
            created={created}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(5);
              } catch {
                // error is already set in the hook
              }
            }}
            onOpenCreated={() => {
              wizard.forceGoTo(5);
            }}
            onReset={resetTestLink}
          />
        ),
      },
      {
        id: "calcom-step-6",
        title: "Verify tracking works",
        isComplete: validated,
        content: (
          <WaitForLeadStep
            title="Verify tracking works"
            description="Complete a test booking using the link above."
            linkHref={created?.shortLink ?? null}
            canStart={Boolean(created?.id)}
            waiting={validating}
            done={validated}
            warnings={[
              <strong key="email">Use a new email for each test.</strong>,
            ]}
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
    resetTestLink,
    scriptInstalled,
    scriptVerified,
    secret,
    step1Done,
    step2Done,
    validated,
    validating,
    webhookUrl,
    workspaceId,
    wizard,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Cal.com setup"
      subtitle="Install the script, configure the webhook, then validate tracking with a test booking."
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
  );
}
