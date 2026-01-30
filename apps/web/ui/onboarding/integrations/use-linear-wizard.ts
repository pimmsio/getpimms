"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Generic helper for linear onboarding wizards:
 * - derives the furthest reachable step from a list of step completion flags
 * - clamps active step so users can't jump ahead
 * - provides safe navigation helpers
 */
export function useLinearWizard({
  completed,
  initialStepIndex = 0,
  stepsCount,
  isIndexAlwaysReachable,
}: {
  completed: boolean[];
  initialStepIndex?: number;
  /**
   * Total number of steps in the UI.
   * Useful when you have optional steps that should be reachable but
   * shouldn't participate in the linear completion flags.
   */
  stepsCount?: number;
  /**
   * Mark a step index as always reachable (e.g., optional info steps).
   * Those indices won't be clamped back to `maxReachableStepIndex`.
   */
  isIndexAlwaysReachable?: (idx: number) => boolean;
}) {
  const maxReachableStepIndex = useMemo(() => {
    const firstIncomplete = completed.findIndex((v) => !v);
    if (firstIncomplete === -1) return Math.max(0, completed.length - 1);
    return firstIncomplete;
  }, [completed]);

  const [activeStepIndex, setActiveStepIndex] = useState(initialStepIndex);

  useEffect(() => {
    // Clamp active step when progress changes (e.g., async completion).
    setActiveStepIndex((prev) => {
      if (prev <= maxReachableStepIndex) return prev;
      if (isIndexAlwaysReachable?.(prev)) return prev;
      return maxReachableStepIndex;
    });
  }, [isIndexAlwaysReachable, maxReachableStepIndex]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0) return;
      if (idx > maxReachableStepIndex && !isIndexAlwaysReachable?.(idx)) return;
      setActiveStepIndex(idx);
    },
    [isIndexAlwaysReachable, maxReachableStepIndex],
  );

  /**
   * Navigation that ignores the current `maxReachableStepIndex`.
   * Useful right after marking a step complete (state updates are async).
   */
  const forceGoTo = useCallback((idx: number) => {
    setActiveStepIndex(() => {
      const last = Math.max(0, (stepsCount ?? completed.length) - 1);
      const next = Math.max(0, Math.min(idx, last));
      return next;
    });
  }, [completed.length, stepsCount]);

  const advance = useCallback(() => {
    setActiveStepIndex((prev) => {
      const last = Math.max(0, (stepsCount ?? completed.length) - 1);
      return Math.min(prev + 1, last);
    });
  }, [completed.length, stepsCount]);

  return {
    activeStepIndex,
    setActiveStepIndex,
    maxReachableStepIndex,
    goTo,
    forceGoTo,
    advance,
  };
}

