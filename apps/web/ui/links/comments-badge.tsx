"use client";

import { Markdown } from "@/ui/shared/markdown";
import { Page2 } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import * as HoverCard from "@radix-ui/react-hover-card";

export function CommentsBadge({ comments, maxWidth = "300px" }: { comments: string, maxWidth?: string }) {
  return (
    <div className="hidden sm:block">
      <HoverCard.Root openDelay={100}>
        <HoverCard.Portal>
          <HoverCard.Content
            side="bottom"
            sideOffset={8}
            className="animate-slide-up-fade z-[99] items-center overflow-hidden rounded border border-neutral-100 bg-white shadow-sm"
          >
            <div className="divide-y-neutral-200 divide-y text-sm">
              <div className="flex items-center gap-2 px-4 py-3">
                <Page2 className="size-3.5" />
                <span className="text-neutral-500">Link comments</span>
              </div>
              <Markdown className="max-w-[300px] whitespace-normal break-words px-5 py-3">
                {comments}
              </Markdown>
            </div>
          </HoverCard.Content>
        </HoverCard.Portal>
        <HoverCard.Trigger asChild>
          <div className="rounded-full py-1 px-2 hover:bg-neutral-100 text-neutral-600 text-ellipsis line-clamp-1 max-w-sm" style={{ maxWidth }}>
            {comments}
          </div>
        </HoverCard.Trigger>
      </HoverCard.Root>
    </div>
  );
}
