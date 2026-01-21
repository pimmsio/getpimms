"use client";

import { ReactNode } from "react";
import WorkspaceAuth from "./auth";
import { OnboardingOverlay } from "./onboarding-overlay";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceAuth>
      {children}
      <OnboardingOverlay />
    </WorkspaceAuth>
  );
}
