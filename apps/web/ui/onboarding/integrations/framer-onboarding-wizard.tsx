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
import { canonicalizeProviderId } from "@/ui/onboarding/canonical-provider-id";
import { useEffect, useMemo, useState } from "react";

const GUIDE_URL =
  "https://pimms.io/guides/how-to-track-framer-form-submissions-marketing-attribution";
const GUIDE_STEP_2_URL = `${GUIDE_URL}#2-build-a-pimms-compatible-form`;
const DETECTION_SCRIPT =
  '<script defer src="https://cdn.pimms.io/analytics/script.detection.js"></script>';
const INJECT_FORM_SCRIPT =
  '<script defer src="https://cdn.pimms.io/analytics/script.inject-form.js"></script>';

export function FramerOnboardingWizard({
  guideThumbnail,
}: {
  guideThumbnail?: string | null;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds } =
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
    const canonical = canonicalizeProviderId("framer");
    const has = completedProviderIds.some(
      (id) => canonicalizeProviderId(id) === canonical,
    );
    if (has) return;
    void setCompletedProviderIds([...completedProviderIds, canonical]);
  }, [completedProviderIds, done, setCompletedProviderIds]);

  const completed = useMemo(
    () => [scriptInstalled, scriptVerified, formOk, webhookOk, Boolean(created), done],
    [created, done, formOk, scriptInstalled, scriptVerified, webhookOk],
  );

  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const webhookUrl = useMemo(() => {
    if (!workspaceId) return "";
    return `https://app.pimms.io/api/framer/webhook?workspace_id=${encodeURIComponent(
      workspaceId,
    )}`;
  }, [workspaceId]);

  const steps = useMemo(() => {
    return [
      {
        id: "framer-step-1",
        title: "Install the script",
        isComplete: scriptInstalled,
        content: (
          <InstallScriptStep
            title="Add the Pimms script"
            description="In Framer, add the tracking script in Site settings → Custom Code (Head), and add the form script on pages that contain a form."
            scripts={[
              { label: "Tracking script (Head)", value: DETECTION_SCRIPT },
              { label: "Form script (pages with a form)", value: INJECT_FORM_SCRIPT },
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
        id: "framer-step-2",
        title: "Verify installation",
        isComplete: scriptVerified,
        content: (
          <ScriptInstallVerifyStep
            title="Verify the scripts are detected"
            description="Paste the URL of a page containing your Framer form. We’ll check it periodically until it’s detected."
            required={{ detection: true, injectForm: true }}
            initialUrlPlaceholder="your-site.com/page-with-framer-form"
            autoVerify
            onNext={() => {
              setScriptVerified(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "framer-step-3",
        title: "Build a compatible form",
        isComplete: formOk,
        content: (
          <ManualConfirmStep
            title="Make your form Pimms-compatible"
            description="Follow the guide step and ensure your form captures the required fields."
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
        id: "framer-step-4",
        title: "Configure webhook",
        isComplete: webhookOk,
        content: (
          <WebhookConfigStep
            title="Add the Framer webhook"
            description="In Framer forms settings, paste this webhook URL."
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
        id: "framer-step-5",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste your page URL (the one with the form). We’ll create a test short link."
            urlValue={pageUrl}
            urlPlaceholder="https://your-site.com/form"
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
        id: "framer-step-6",
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
      title="Framer setup"
      subtitle="Install the script, configure the webhook, then validate tracking with a test submission."
      contentTop={
        <GuideCard title="Framer guide" href={GUIDE_URL} thumbnail={guideThumbnail ?? null} />
      }
      steps={steps}
      currentStepIndex={wizard.activeStepIndex}
      maxSelectableStepIndex={wizard.maxReachableStepIndex}
      onSelectStep={(idx) => wizard.goTo(idx)}
    />
  );
}

