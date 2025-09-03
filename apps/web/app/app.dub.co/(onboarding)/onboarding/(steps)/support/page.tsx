"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { LaterButton } from "../../later-button";
import { StepPage } from "../step-page";

export default function Support() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30-minutes-onboarding" });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#3970ff" },
          dark: { "cal-brand": "#fafafa" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <StepPage
      title="Get personalized onboarding support"
      description="Need help getting started? Alexandre Sarfati is here to help you make the most of Pimms with a personalized onboarding call."
      className="max-w-4xl"
    >
      {/* Skip button at the top */}
      <div className="mb-8 flex justify-center">
        <LaterButton
          next="finish"
          className="text-sm underline-offset-4 hover:text-gray-700 hover:underline"
        >
          Finish onboarding now
        </LaterButton>
      </div>

      <div className="space-y-8">
        <div className="w-full">
          <Cal
            namespace="30-minutes-onboarding"
            calLink="alexandre-sarfati/30-minutes-onboarding"
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
            config={{ layout: "month_view" }}
          />
        </div>
      </div>
    </StepPage>
  );
}
