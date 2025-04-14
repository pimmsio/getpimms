"use client";

import { Button } from "@dub/ui";
import {
  arrow,
  autoUpdate,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useRef } from "react";

export function ConversionOnboardingPopup({
  referenceElement,
  onCTA,
  onDismiss,
}: {
  referenceElement: HTMLDivElement | null;
  onCTA: () => void;
  onDismiss: () => void;
}) {
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted(referenceEl, floatingEl, update) {
      const cleanup = autoUpdate(referenceEl, floatingEl, update, {
        // Not good for performance but keeps the arrow and floating element in the right spot
        animationFrame: true,
      });
      return cleanup;
    },
    elements: {
      reference: referenceElement,
    },
    middleware: [
      offset({
        mainAxis: 32,
        crossAxis: 7,
      }),
      shift({
        padding: 32,
      }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="drop-shadow-sm"
      >
        <div className="animate-slide-up-fade relative flex w-[240px] flex-col rounded-xl border-[6px] border-neutral-100 bg-white p-3 text-left">
          {/* <div className="relative">
            <Link
              href="https://d.to/conversions"
              target="_blank"
              className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-[2px] border-neutral-100 bg-neutral-100"
            >
              <BlurImage
                src="https://assets.dub.co/blog/conversion-analytics.png"
                alt="thumbnail"
                fill
                className="object-cover"
              />
              <div className="relative flex size-10 items-center justify-center rounded-full bg-neutral-900 ring-[6px] ring-black/5 transition-all duration-75 group-hover:ring-[8px] group-active:ring-[7px]">
                <Play className="size-4 fill-current text-white" />
              </div>
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-2 top-2 rounded-xl border-[2px] border-neutral-100 bg-white p-1.5 shadow-sm transition-colors duration-75 hover:bg-neutral-50"
            >
              <X className="size-4 text-neutral-500" />
            </button>
          </div> */}
          <h2 className="mt-4 text-sm font-semibold text-neutral-700">
            🎉 New conversion analytics
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500">
            Follow our guide to get set up and track your deep link conversions
          </p>
          <div className="grid-row-2 mt-4 grid w-full gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-7 text-xs"
              text="Maybe later"
              onClick={onDismiss}
            />
            <Button
              type="button"
              variant="primary"
              className="h-7 text-xs"
              text="View guide"
              onClick={onCTA}
            />
          </div>
          <FloatingArrow
            ref={arrowRef}
            context={context}
            className="stroke-neutral-200"
            fill="white"
            strokeWidth={1}
            height={10}
          />
        </div>
      </div>
    </FloatingPortal>
  );
}
