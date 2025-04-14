"use client";

import { useEffect } from "react";

export default function DirectLinkRedirect({ directLink, url, os, browser }: { directLink: string | undefined; url: string; os: "ios" | "android" | undefined; browser: string | undefined }) {
  useEffect(() => {
    if (!directLink) {
      return;
    }

    // After a short delay, force navigation to the YouTube web URL.
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Redirect to the redirect URL (which may be the same as the original URL,
  // or a cleaned-up version with properly encoded parameters)
  if (directLink) {
    return <meta httpEquiv="refresh" content={`0;url=${directLink}`} />;
  } else {
    return <meta httpEquiv="refresh" content={`0;url=${url}`} />;
  }
}