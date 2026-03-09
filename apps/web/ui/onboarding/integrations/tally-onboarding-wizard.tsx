"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { InstallScriptStep } from "@/ui/onboarding/integrations/steps/install-script-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { ScriptInstallVerifyStep } from "@/ui/onboarding/integrations/steps/script-install-verify-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { WebhookConfigStep } from "@/ui/onboarding/integrations/steps/webhook-config-step";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { useEffect, useMemo, useState } from "react";

const TALLY_GUIDE_URL =
  "https://pimms.io/guides/tally-direct-webhook-integration";

const TALLY_WEBHOOK_BASE = "https://api.pimms.io/webhook/tally";

const TALLY_DETECTION_SCRIPT =
  `<script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-domains='{"outbound":"tally.so"}'></script>`;

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

   const [scriptInstalled, setScriptInstalled] = useState(false);
   const [scriptVerified, setScriptVerified] = useState(false);
   const [step1Done, setStep1Done] = useState(false);
   const [step2Done, setStep2Done] = useState(false);
 
   const {
     url: formUrl,
     setUrl: setFormUrl,
     creating,
     error: createError,
     created,
     create: createTestLink,
     reset: resetTestLink,
   } = useCreateOnboardingTestLink({ workspaceId });
 
   const { waiting, done } = useWaitForLinkLead({
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
     () => [scriptInstalled, scriptVerified, step1Done, step2Done, Boolean(created), done],
     [created, done, scriptInstalled, scriptVerified, step1Done, step2Done],
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
         title: "Install the script",
         isComplete: scriptInstalled,
         content: (
           <InstallScriptStep
             title="Add the Pimms script"
             description="Install the detection script on the page where your Tally form is embedded. It auto-injects pimms_id into Tally embeds and outbound links."
             scripts={[{ label: "Detection script (with Tally outbound)", value: TALLY_DETECTION_SCRIPT }]}
             mergeNote={
               <>
                 Already have the Pimms detection script from another integration? Update the existing{" "}
                 <code className="font-mono text-xs">data-domains</code> attribute to include{" "}
                 <code className="font-mono text-xs">tally.so</code> in the outbound list (e.g.{" "}
                 <code className="font-mono text-xs">{`"outbound":"tally.so,cal.com"`}</code>) instead of adding a duplicate script tag.
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
         id: "tally-step-2",
         title: "Verify installation",
         isComplete: scriptVerified,
         content: (
           <ScriptInstallVerifyStep
             title="Verify the script is detected"
             description="Paste the URL of the page where your Tally form is embedded. We'll check for the detection script and Tally outbound config."
             required={{ detection: true, outbound: "tally.so" }}
             initialUrlPlaceholder="your-site.com/page-with-tally-form"
             autoVerify
             onNext={() => {
               setScriptVerified(true);
               wizard.advance();
             }}
           />
         ),
       },
       {
         id: "tally-step-3",
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
                 Open step in guide
               </button>
             }
           />
         ),
       },
       {
         id: "tally-step-4",
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
         id: "tally-step-5",
         title: "Create a test link",
         isComplete: Boolean(created),
         content: (
           <CreateTestLinkStep
             title="Create a test link (expires in 24h)"
             description={
               created
                 ? "Test link ready. Open in an incognito tab and submit the form."
                 : "Paste the URL of the page that hosts your Tally form."
             }
             urlValue={formUrl}
             urlPlaceholder="https://your-site.com/page-with-tally-form"
             onChangeUrl={setFormUrl}
             creating={creating}
             error={createError}
             created={created}
             onCreate={async () => {
               try {
                 await createTestLink();
                 wizard.forceGoTo(5);
               } catch {
                 // error already set by hook
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
         id: "tally-step-6",
         title: "Verify tracking works",
         isComplete: done,
         content: (
           <WaitForLeadStep
             title="Submit a test form"
             description="Submit the form using the test link above."
             linkHref={created?.shortLink ?? null}
             canStart={Boolean(created?.id)}
             waiting={waiting}
             done={done}
             waitingLabel="Waiting for lead…"
             successLabel="Contact recorded. Tracking works."
             warnings={[
               <strong key="email">Use a new email for each test.</strong>,
             ]}
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
     resetTestLink,
     scriptInstalled,
     scriptVerified,
     setFormUrl,
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
       subtitle="Install the script, configure the webhook, then validate tracking with a test submission."
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
 
