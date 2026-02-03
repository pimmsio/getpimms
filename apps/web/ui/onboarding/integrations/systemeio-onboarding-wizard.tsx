"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { ScriptInstallVerifyStep } from "@/ui/onboarding/integrations/steps/script-install-verify-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useEffect, useMemo, useState } from "react";

const GUIDE_URL =
  "https://pimms.io/guides/how-to-track-systemeio-sales-and-leads-marketing-attribution";
const GUIDE_STEP_1_URL = `${GUIDE_URL}#1-install-the-tracking-script`;
const SYSTEMEIO_SCRIPT =
  '<script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-forward-all="true"></script>';

export function SystemeioOnboardingWizard({
  guideHref = GUIDE_URL,
  guideThumbnail,
  providerId = "systemeio",
}: {
  guideHref?: string;
  guideThumbnail?: string | null;
  providerId?: string;
}) {
  const { id: workspaceId } = useWorkspace();
  const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
    useOnboardingPreferences();

  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [scriptVerified, setScriptVerified] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const {
    url: funnelUrl,
    setUrl: setFunnelUrl,
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

  const validated = done;
  const validating = waiting;

  // Persist completion once a lead is detected.
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
    () => [
      scriptInstalled,
      scriptVerified,
      webhookConfigured,
      Boolean(created),
      validated,
    ],
    [created, scriptInstalled, scriptVerified, validated, webhookConfigured],
  );
  const wizard = useLinearWizard({ completed, initialStepIndex: 0 });

  const webhookUrl = useMemo(() => {
    if (!workspaceId) return "";
    return `https://app.pimms.io/api/systemeio/webhook?workspace_id=${encodeURIComponent(
      workspaceId,
    )}`;
  }, [workspaceId]);

  const secret = workspaceId || "";

  const steps = useMemo(() => {
    return [
      {
        id: "systemeio-step-1",
        title: "Install the tracking script",
        isComplete: scriptInstalled,
        content: (
          <InstallScriptStep
            title="Install the Pimms tracking script"
            description="Paste this script into Systeme.io → Settings → Sales funnels → Tracking code, then continue."
            scriptLabel="Tracking script"
            script={SYSTEMEIO_SCRIPT}
            guideStepHref={GUIDE_STEP_1_URL}
            guideStepLabel="Open step 1 in guide"
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
        id: "systemeio-step-2",
        title: "Verify installation",
        isComplete: scriptVerified,
        content: (
          <ScriptInstallVerifyStep
            title="Verify the script is detected"
            description="Paste a public URL of your funnel page (or your website) to verify the script is installed."
            required={{ detection: true }}
            initialUrlPlaceholder="youraccount.systeme.io/your-funnel"
            autoVerify
            onNext={() => {
              setScriptVerified(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "systemeio-step-3",
        title: "Configure the webhook",
        isComplete: webhookConfigured,
        content: (
          <WebhookConfigStep
            title="Webhook configuration"
            description="Paste these values in Systeme.io → Settings → Webhooks. Select events: Opt-in + New sale."
            fields={[
              { label: "Webhook URL", value: webhookUrl, disabled: !webhookUrl },
              { label: "Secret", value: secret, disabled: !secret },
            ]}
            isDone={webhookConfigured}
            confirmDisabled={!workspaceId}
            onConfirm={() => {
              setWebhookConfigured(true);
              wizard.advance();
            }}
          />
        ),
      },
      {
        id: "systemeio-step-4",
        title: "Create a test link",
        isComplete: Boolean(created),
        content: (
          <CreateTestLinkStep
            title="Create a test link (expires in 24h)"
            description="Paste the first step of your Systeme.io funnel URL. We’ll create a test short link."
            urlValue={funnelUrl}
            urlPlaceholder="https://youraccount.systeme.io/your-funnel"
            onChangeUrl={setFunnelUrl}
            creating={creating}
            error={createError}
            created={created}
            onCreate={async () => {
              try {
                await createTestLink();
                wizard.forceGoTo(4);
              } catch {
                // error is already set in the hook
              }
            }}
            onOpenCreated={() => {
              wizard.forceGoTo(4);
              startWaitingForLead();
            }}
          />
        ),
      },
      {
        id: "systemeio-step-5",
        title: "Verify tracking works",
        isComplete: validated,
        content: (
          <WaitForLeadStep
            title="Run a test opt-in (and optionally a sale)"
            description="Open your test link in an incognito tab and complete an opt-in. If your funnel includes payment, you can also run a test purchase."
            linkHref={created?.shortLink ?? null}
            canStart={Boolean(created?.id)}
            waiting={validating}
            done={validated}
            onStartWaiting={startWaitingForLead}
            waitingLabel="Waiting for lead…"
            successLabel="Contact recorded. Tracking works."
          />
        ),
      },
    ];
  }, [
    createError,
    createTestLink,
    created,
    creating,
    funnelUrl,
    scriptInstalled,
    scriptVerified,
    setFunnelUrl,
    secret,
    startWaitingForLead,
    validated,
    validating,
    webhookConfigured,
    webhookUrl,
    workspaceId,
    wizard,
  ]);

  return (
    <IntegrationOnboardingWizard
      title="Systeme.io setup"
      subtitle="Install the script, configure the webhook, then validate tracking with a test opt-in."
      contentTop={
        <GuideCard
          title="Systeme.io guide"
          href={guideHref}
          thumbnail={guideThumbnail ?? null}
        />
      }
      steps={steps}
      currentStepIndex={wizard.activeStepIndex}
      maxSelectableStepIndex={wizard.maxReachableStepIndex}
      onSelectStep={(idx) => wizard.goTo(idx)}
    />
  );
}

