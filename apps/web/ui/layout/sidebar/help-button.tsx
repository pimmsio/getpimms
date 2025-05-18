"use client";

import { Popover } from "@dub/ui";
import { MessageSquareText } from "lucide-react";
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
      <div className="px-3 py-1">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              posthog.capture("help_portal_opened");
            }
            setIsOpen((o) => !o);
          }}
          className="group flex items-center gap-1 text-xs font-medium text-[#08272E] transition-colors hover:text-neutral-900"
        >
          <MessageSquareText className="size-4" />
          Contact Us
        </button>
      </div>
    </Popover>
    // </HelpContext.Provider>
  ): null;
}
