"use client";

import { PosthogPageview } from "@/ui/layout/posthog-pageview";
import PlausibleProvider from "next-plausible";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { ReactNode } from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/_proxy/posthog/ingest",
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    capture_pageleave: true, // Enable pageleave capture
  });
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PlausibleProvider
        domain="pimms.io"
        revenue
        scriptProps={{
          src: "/_proxy/plausible/script.js",
          // @ts-ignore
          "data-api": "/_proxy/plausible/event",
        }}
      />
      <PosthogPageview />
      {children}
    </PostHogProvider>
  );
}
