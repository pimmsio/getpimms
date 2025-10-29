"use client";

import { Wordmark } from "./wordmark";

/**
 * The Dub logo with a custom context menu for copying/navigation,
 * for use in the top site nav
 */
export function NavWordmark({
  className,
}: {
  variant?: "full" | "symbol";
  isInApp?: boolean;
  className?: string;
}) {
  return (    
    <Wordmark className={className} />
  );
}


