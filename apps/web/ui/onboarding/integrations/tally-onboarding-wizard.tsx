"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { GuideCard } from "@/ui/onboarding/integrations/components/guide-card";
import { IntegrationOnboardingWizard } from "@/ui/onboarding/integrations/integration-onboarding-wizard";
import { CreateTestLinkStep } from "@/ui/onboarding/integrations/steps/create-test-link-step";
import { ManualConfirmStep } from "@/ui/onboarding/integrations/steps/manual-confirm-step";
import { WaitForLeadStep } from "@/ui/onboarding/integrations/steps/wait-for-lead-step";
import { useCreateOnboardingTestLink } from "@/ui/onboarding/integrations/use-create-onboarding-test-link";
import { useLinearWizard } from "@/ui/onboarding/integrations/use-linear-wizard";
import { useWaitForLinkLead } from "@/ui/onboarding/integrations/use-wait-for-link-lead";
import { useEffect, useMemo, useState } from "react";

const TALLY_GUIDE_URL =
  "https://pimms.io/guides/how-to-track-tally-form-submissions-marketing-attribution";

export function TallyOnboardingWizard({
  guideThumbnail,
}: {
  guideThumbnail?: string | null;
}) {
   const { id: workspaceId } = useWorkspace();
   const { completedProviderIds, setCompletedProviderIds } = useOnboardingPreferences();
 
   const [guideDone, setGuideDone] = useState(false);
 
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
     if (completedProviderIds.includes("tally")) return;
     void setCompletedProviderIds([...completedProviderIds, "tally"]);
   }, [completedProviderIds, done, setCompletedProviderIds]);
 
   const completed = useMemo(
     () => [guideDone, Boolean(created), done],
     [created, done, guideDone],
   );
   const wizard = useLinearWizard({ completed, initialStepIndex: 0 });
 
   const steps = useMemo(() => {
     return [
       {
         id: "tally-step-1",
         title: "Setup in Tally",
         isComplete: guideDone,
         content: (
           <ManualConfirmStep
             title="Follow the guide in Tally"
             description="Open the guide and complete the setup in Tally, then continue."
             isDone={guideDone}
             onConfirm={() => {
               setGuideDone(true);
               wizard.advance();
             }}
             actions={
               <button
                 type="button"
                 className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                 onClick={() => window.open(TALLY_GUIDE_URL, "_blank", "noopener,noreferrer")}
               >
                 Open guide
               </button>
             }
           />
         ),
       },
       {
         id: "tally-step-2",
         title: "Test link",
         isComplete: Boolean(created),
         content: (
           <CreateTestLinkStep
             title="Create a test link (expires in 24h)"
             description="Paste the URL of the page that hosts your Tally form."
             urlValue={formUrl}
             urlPlaceholder="https://your-site.com/page-with-tally-form"
             onChangeUrl={setFormUrl}
             creating={creating}
             error={createError}
             created={created}
             onCreate={async () => {
               try {
                 await createTestLink();
                 wizard.forceGoTo(2);
               } catch {
                 // error already set by hook
               }
             }}
             onOpenCreated={() => {
               wizard.forceGoTo(2);
               startWaitingForLead();
             }}
           />
         ),
       },
       {
         id: "tally-step-3",
         title: "Verify",
         isComplete: done,
         content: (
           <WaitForLeadStep
             title="Verify tracking works"
             description="Submit a test Tally form using the test link. We’ll wait for the lead."
             linkHref={created?.shortLink ?? null}
             canStart={Boolean(created?.id)}
             waiting={waiting}
             done={done}
             onStartWaiting={startWaitingForLead}
             waitingLabel="Waiting for lead…"
             successLabel="Lead recorded. Tracking works."
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
     guideDone,
     setFormUrl,
     startWaitingForLead,
     waiting,
     wizard,
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
 
