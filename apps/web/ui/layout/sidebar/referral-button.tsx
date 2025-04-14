"use client";

import { ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function ReferralButton() {
  const { slug } = useParams() as { slug?: string };

  return slug ? (
    <div className="px-3 py-1">
      <div className="flex items-center justify-between gap-3">
        <Link
          className="group flex items-center gap-0.5 text-sm font-semibold text-[#08272E] transition-colors hover:text-neutral-900"
          href="/account/settings/referrals"
        >
          <Gift className="size-4" />
          Referral Program
          <ChevronRight className="size-3 text-neutral-400 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-neutral-500" />
        </Link>
      </div>
    </div>
  ) : null;
}
