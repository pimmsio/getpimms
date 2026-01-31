"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useWorkspace from "@/lib/swr/use-workspace";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { ScriptInstallVerifyStep } from "@/ui/onboarding/integrations/steps/script-install-verify-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useEffect, useMemo, useState } from "react";

const GUIDE_URL =
  "https://pimms.io/guides/how-to-track-webflow-form-submissions-marketing-attribution";
const GUIDE_STEP_2_URL = `${GUIDE_URL}#2-build-a-pimms-compatible-form`;
const DETECTION_SCRIPT =
  '<script defer src="https://cdn.pimms.io/analytics/script.detection.js"></script>';
const INJECT_FORM_SCRIPT =
  '<script defer src="https://cdn.pimms.io/analytics/script.inject-form.js"></script>';

export function WebflowOnboardingWizard({
  guideThumbnail,
  providerId = "webflow",
}: {
  guideThumbnail?: string | null;
  providerId?: string;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
    useOnboardingPreferences();

  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [scriptVerified, setScriptVerified] = useState(false);
  const [formOk, setFormOk] = useState(false);
  const [webhookOk, setWebhookOk] = useState(false);

  const {
    url: pageUrl,
    setUrl: setPageUrl,
    creating,
    error: createError,
    created,
    create: createTestLink,
  } = useCreateOnboardingTestLink({ workspaceId });

  const { waiting, done, start: startWaitingForLead } = useWaitForLinkLead({
    workspaceId,
    linkId: created?.id,
  });

  useEffect(() => {
    if (!done) return;
    if (completedProviderIds.includes(providerId)) return;
    void setCompletedProviderIds([...completedProviderIds, providerId]);
  }, [completedProviderIds, done, providerId, setCompletedProviderIds]);

  useEffect(() => {
    if (!scriptInstalled) return;
    void markProviderStarted(providerId);
  }, [markProviderStarted, providerId, scriptInstalled]);

  const completed = useMemo(
    () => [scriptInstalled, scriptVerified, formOk, webhookOk, Boolean(created), done],
    [created, done, formOk, scriptInstalled, scriptVerified, webhookOk],
  );

  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const webhookUrl = useMemo(() => {
    if (!workspaceId) return "";
    return `https://api.pimms.io/webflow/webhook?workspace_id=${encodeURIComponent(
      workspaceId,
    )}`;
  }, [workspaceId]);

  const steps = useMemo(() => {
    return [
      {
        id: "webflow-step-1",
        title: "Install scripts",
        isComplete: scriptInstalled,
        content: (
          <InstallScriptStep
            title="Add the Pimms scripts"
            description="Webflow forms require the detection script and the form injection script."
            scripts={[
              { label: "Detection script", value: DETECTION_SCRIPT },
              { label: "Inject form script", value: INJECT_FORM_SCRIPT },
            ]}
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
        id: "webflow-step-2",
        title: "Verify installation",
        isComplete: scriptVerified,
        content: (
          <ScriptInstallVerifyStep
            title="Verify the scripts are detected"
            description="Paste the URL of a page containing your Webflow form. We’ll check it periodically until it’s detected."
            required={{ detection: true, injectForm: true }}
            initialUrlPlaceholder="your-site.com/page-with-webflow-form"
            autoVerify
            onNext={() => {
              setScriptVerified(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "webflow-step-3",
        title: "Build a compatible form",
        isComplete: formOk,
        content: (
          <ManualConfirmStep
            title="Make your form Pimms-compatible"
            description="Follow the guide step and ensure your form uses the right field names."
            isDone={formOk}
            onConfirm={() => {
              setFormOk(true);
              wizard.advance();
            }}
            actions={
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                onClick={() =>
                  window.open(GUIDE_STEP_2_URL, "_blank", "noopener,noreferrer")
                }
              >
                Open guide step 2
              </button>
            }
          />
        ),
      },
      {
        id: "webflow-step-4",
        title: "Configure webhook",
        isComplete: webhookOk,
        content: (
          <WebhookConfigStep
            title="Add the Webflow webhook"
            description="In Webflow → Site settings → Apps & Integrations → Add Webhook, paste this URL."
            fields={[{ label: "Webhook URL", value: webhookUrl, disabled: !webhookUrl }]}
            isDone={webhookOk}
            confirmDisabled={!workspaceId}
            onConfirm={() => {
              setWebhookOk(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "webflow-step-5",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your page URL (the one with the form). We’ll create a test short link."
            urlValue={pageUrl}
            urlPlaceholder="https://your-site.webflow.io/lead-form"
            onChangeUrl={setPageUrl}
            creating={creating}
            error={createError}
            created={created}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(5);
              } catch {
                // error already set
              }
            }}
            onOpenCreated={() => {
              wizard.forceGoTo(5);
              startWaitingForLead();
            }}
          />
        ),
      },
      {
        id: "webflow-step-6",
        title: "Verify tracking works",
        isComplete: done,
        content: (
          <WaitForLeadStep
            title="Submit a test form"
            description="Open the test link in an incognito tab, submit the form with a fresh test email, then we’ll wait for the lead."
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
    createError,
    createTestLink,
    created,
    creating,
    done,
    formOk,
    pageUrl,
    scriptInstalled,
    scriptVerified,
    setPageUrl,
    startWaitingForLead,
    waiting,
    webhookOk,
    webhookUrl,
    workspaceId,
    wizard,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Webflow setup"
      subtitle="Install scripts, configure the webhook, then validate tracking with a test submission."
      contentTop={
        <GuideCard title="Webflow guide" href={GUIDE_URL} thumbnail={guideThumbnail ?? null} />
      }
      steps={steps}
      currentStepIndex={wizard.activeStepIndex}
      maxSelectableStepIndex={wizard.maxReachableStepIndex}
      onSelectStep={(idx) => wizard.goTo(idx)}
    />
  );
}

