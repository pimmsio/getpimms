"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import Link from "next/link";
import { useParams } from "next/navigation";

export function FreeAccountSection() {
  const { slug } = useParams() as { slug?: string };
  const { plan } = useWorkspace();

  // Only show for free plan
  if (plan !== "free") {
    return null;
  }

  return (
    <div className="mx-3 mb-3 rounded-lg border border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">Free Account</h3>
        <p className="mt-1 text-xs text-neutral-600">
          Your free account is active.
        </p>
      </div>
      <Link
        href={`/${slug}/settings/billing/upgrade`}
        className="mt-3 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
      >
        Explore plans →
      </Link>
    </div>
  );
}
