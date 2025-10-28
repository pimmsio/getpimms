"use client";

import { cn } from "@dub/utils";
import { Gift } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function ReferralButton({ className }: { className?: string }) {
  const { slug } = useParams() as { slug?: string };

  return slug ? (
    <Link
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-xs font-medium text-neutral-700 transition-all duration-100",
        "hover:bg-neutral-100 hover:text-neutral-900",
        "active:bg-neutral-200/60 active:scale-[0.98]",
        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        "min-h-[40px] sm:min-h-[36px]", // Better touch targets on mobile
        className
      )}
      href="/account/settings/referrals"
    >
      <Gift className="size-4 shrink-0" />
      <span className="hidden sm:inline">Referrals</span>
    </Link>
  ) : null;
}
