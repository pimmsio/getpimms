"use client";

import { useEffect, useState } from "react";

/**
 * Hook to calculate and maintain form height to prevent modal scrolling
 * Sets the form height based on available viewport space and constrains the modal
 */
export function useModalFormHeight(
  isOpen: boolean,
  formRef: { current: HTMLFormElement | null },
): number | undefined {
  const [formHeight, setFormHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;

    const updateFormHeight = () => {
      const modalContent = document.querySelector(
        '[role="dialog"]',
      ) as HTMLElement;
      if (modalContent && formRef.current) {
        const modalRect = modalContent.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Calculate available height: viewport height minus modal's top and bottom margins
        const modalTop = modalRect.top;
        const modalBottom = viewportHeight - modalRect.bottom;
        const availableHeight = viewportHeight - modalTop - modalBottom;
        // Set form height to available height to prevent modal scrolling
        setFormHeight(availableHeight);
        // Also set modal's max-height and overflow to prevent it from growing beyond viewport
        // Use !important to override the h-fit class and overflow-y-auto
        modalContent.style.setProperty(
          "max-height",
          `${availableHeight}px`,
          "important",
        );
        modalContent.style.setProperty("overflow", "hidden", "important");
      }
    };

    // Initial calculation with delay to ensure DOM is ready
    const timeoutId = setTimeout(updateFormHeight, 100);
    // Update on resize
    window.addEventListener("resize", updateFormHeight);
    // Update when modal content changes (including when UTM panel expands)
    const observer = new MutationObserver(() => {
      setTimeout(updateFormHeight, 100);
    });
    const modalContent = document.querySelector(
      '[role="dialog"]',
    ) as HTMLElement;
    if (modalContent) {
      observer.observe(modalContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateFormHeight);
      observer.disconnect();
      const modalContent = document.querySelector(
        '[role="dialog"]',
      ) as HTMLElement;
      if (modalContent) {
        // Clean up inline styles when modal closes
        modalContent.style.removeProperty("max-height");
        modalContent.style.removeProperty("overflow");
      }
    };
  }, [isOpen, formRef]);

  return formHeight;
}
