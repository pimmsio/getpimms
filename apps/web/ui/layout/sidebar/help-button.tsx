"use client";

import { Popover } from "@dub/ui";
import { cn } from "@dub/utils";
import posthog from "posthog-js";
import { useState } from "react";
import { HelpArticle } from "../help";
import { HelpSection } from "../help/help-section";
import { useParams } from "next/navigation";

export function HelpButton(
  {
    // popularHelpArticles,
    // allHelpArticles,
  }: {
    popularHelpArticles?: HelpArticle[];
    allHelpArticles?: HelpArticle[];
  },
) {
  const { slug } = useParams() as { slug?: string };
  const [isOpen, setIsOpen] = useState(false);

  return slug ? (
    // <HelpContext.Provider value={{ popularHelpArticles, allHelpArticles }}>
    <Popover
      content={<HelpSection />}
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
      align="start"
    >
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            posthog.capture("help_portal_opened");
          }
          setIsOpen((o) => !o);
        }}
        className={cn(
          "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-xs font-medium text-neutral-700 transition-all duration-100",
          "hover:bg-neutral-100 hover:text-neutral-900",
          "active:bg-neutral-200/60 active:scale-[0.98]",
          "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
          "min-h-[40px] sm:min-h-[36px]" // Better touch targets on mobile
        )}
      >
        <span>Help</span>
      </button>
    </Popover>
    // </HelpContext.Provider>
  ): null;
}
