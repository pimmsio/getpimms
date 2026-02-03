"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { useEffect, useMemo, useState } from "react";

const TALLY_GUIDE_URL =
  "https://pimms.io/guides/tally-direct-webhook-integration";

const TALLY_WEBHOOK_BASE = "https://api.pimms.io/webhook/tally";

function buildTallyWebhookUrl(workspaceId: string) {
  return `${TALLY_WEBHOOK_BASE}?workspace_id=${encodeURIComponent(workspaceId)}`;
}

export function TallyOnboardingWizard({
  guideThumbnail,
  providerId = "tally",
}: {
  guideThumbnail?: string | null;
  providerId?: string;
}) {
   const { id: workspaceId } = useWorkspace();
   const { completedProviderIds, setCompletedProviderIds, markProviderStarted } =
     useOnboardingPreferences();
 
   const [step1Done, setStep1Done] = useState(false);
   const [step2Done, setStep2Done] = useState(false);
 
   const {
     url: formUrl,
     setUrl: setFormUrl,
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
     if (!step1Done) return;
     void markProviderStarted(providerId);
   }, [markProviderStarted, providerId, step1Done]);
 
   const completed = useMemo(
     () => [step1Done, step2Done, Boolean(created), done],
     [created, done, step1Done, step2Done],
   );
   const wizard = useLinearWizard({ completed, initialStepIndex: 0 });
 
   const webhookUrl = useMemo(
     () => (workspaceId ? buildTallyWebhookUrl(workspaceId) : ""),
     [workspaceId],
   );

   const steps = useMemo(() => {
     return [
       {
         id: "tally-step-1",
         title: "Setup in Tally",
         isComplete: step1Done,
         content: (
           <ManualConfirmStep
             title="Add the pimms_id field"
             description="Follow the guide step and add the hidden field to your Tally form."
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
                   window.open(TALLY_GUIDE_URL, "_blank", "noopener,noreferrer");
                 }}
               >
                 Open step 1 in guide
               </button>
             }
           />
         ),
       },
       {
         id: "tally-step-2",
         title: "Set up the webhook in Tally",
         isComplete: step2Done,
         content: (
           <WebhookConfigStep
             title="Webhook configuration"
             description="Paste these values into Tally.so → Integrations → Webhooks."
             fields={[
               {
                 label: "Webhook URL",
                 value: webhookUrl,
                 disabled: !webhookUrl,
               },
               {
                 label: "Signing Secret",
                 value: workspaceId ?? "",
                 disabled: !workspaceId,
               },
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
         id: "tally-step-3",
         title: "Create a test link",
         isComplete: Boolean(created),
         content: (
           <CreateTestLinkStep
             title="Create a test link (expires in 24h)"
             description="Paste the URL of the page that hosts your Tally form."
             urlValue={formUrl}
             urlPlaceholder="https://tally.so/r/your-form or https://your-site.com/page-with-tally-form"
             onChangeUrl={setFormUrl}
             creating={creating}
             error={createError}
             created={created}
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
         id: "tally-step-4",
         title: "Verify the tracking works",
         isComplete: done,
         content: (
           <WaitForLeadStep
             title="Submit a test form"
             description="Open your test link in an incognito tab and submit the Tally form with a test email."
             linkHref={created?.shortLink ?? null}
             canStart={Boolean(created?.id)}
             waiting={waiting}
             done={done}
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
     done,
     formUrl,
     setFormUrl,
     startWaitingForLead,
     step1Done,
     step2Done,
     waiting,
     webhookUrl,
     wizard,
     workspaceId,
   ]);
 
   return (
     <IntegrationOnboardingWizard
       title="Tally setup"
       subtitle="Track Tally form submissions as leads with attribution."
       contentTop={
         <GuideCard title="Tally guide" href={TALLY_GUIDE_URL} thumbnail={guideThumbnail ?? null} />
       }
       steps={steps}
       currentStepIndex={wizard.activeStepIndex}
       maxSelectableStepIndex={wizard.maxReachableStepIndex}
       onSelectStep={(idx) => wizard.goTo(idx)}
     />
   );
 }
 
