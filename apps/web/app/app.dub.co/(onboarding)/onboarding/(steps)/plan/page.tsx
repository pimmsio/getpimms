import { StepPage } from "../step-page";
import { FreePlanButton } from "./free-plan-button";
import { PlanSelector } from "./plan-selector";

export default function Plan() {
  return (
    <StepPage
      title="Choose your plan"
      description={
        <>
          <span className="inline-block">
            Find a plan that fits your needs, or stay on the
          </span>{" "}
          <FreePlanButton className="text-base underline underline-offset-2">
            free plan
          </FreePlanButton>
          .
        </>
      }
      className="max-w-2xl"
    >
      <PlanSelector />
    </StepPage>
  );
}
