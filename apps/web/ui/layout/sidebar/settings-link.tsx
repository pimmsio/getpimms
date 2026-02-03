"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@dub/utils";

function SettingsLink() {
  const { slug } = useParams() as { slug?: string };

  return slug ? (
    <Link
      className={cn(
        "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-xs font-medium text-neutral-700 transition-all duration-100",
        "hover:bg-neutral-100 hover:text-neutral-900",
        "active:bg-neutral-200/60 active:scale-[0.98]",
        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        "min-h-[40px] sm:min-h-[36px]" // Better touch targets on mobile
      )}
      href={`/${slug}/settings`}
    >
      <span>Settings</span>
    </Link>
  ) : null;
}

export { SettingsLink };

