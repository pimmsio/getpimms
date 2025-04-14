"use client";

import { Suspense } from "react";
import { OnboardingButton } from "./onboarding/onboarding-button";
import { cn } from "@dub/utils";

const toolbarItems = ["onboarding", "help"] as const;

type ToolbarProps = {
  show?: (typeof toolbarItems)[number][];
};

export default function Toolbar(props: ToolbarProps) {
  return (
    <Suspense fallback={null}>
      <div className={cn("fixed top-0 bottom-auto m-1 scale-75 sm:bottom-0 right-0 sm:z-40 sm:m-5 sm:scale-100 sm:top-auto")}>
        <ToolbarRSC {...props} />
      </div>
    </Suspense>
  );
}

function ToolbarRSC({ show = ["onboarding", "help"] }: ToolbarProps) {
  // const { popularHelpArticles, allHelpArticles } = await fetch(
  //   "https://dub.co/api/content",
  //   {
  //     next: {
  //       revalidate: 60 * 60 * 24, // cache for 24 hours
  //     },
  //   },
  // )
  //   .then((res) => res.json())
  //   .catch(() => {
  //     return { popularHelpArticles: [], allHelpArticles: [] };
  //   });

  return (
    <div className="flex items-center gap-3">
      {show.includes("onboarding") && (
        <div className="shrink-0">
          <OnboardingButton />
        </div>
      )}
      {/* {show.includes("help") && (
        <div className="shrink-0">
          <HelpButton
            popularHelpArticles={popularHelpArticles}
            allHelpArticles={allHelpArticles}
          />
        </div>
      )} */}
    </div>
  );
}
