"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { capitalize } from "@dub/utils";
import { Crown } from "lucide-react";
import Link from "next/link";

export const UpgradeRequiredToast = ({
  title,
  planToUpgradeTo,
  message,
}: {
  title?: string;
  planToUpgradeTo?: string;
  message: string;
}) => {
  const { slug, nextPlan } = useWorkspace();
  planToUpgradeTo = planToUpgradeTo || nextPlan?.name;

  return (
    <div className="flex flex-col space-y-3 rounded bg-white p-6 shadow-lg">
      <div className="flex items-center space-x-1.5">
        <Crown className="h-5 w-5 text-black" />{" "}
        <p className="font-semibold">
          {title ||
            `You've discovered a ${capitalize(planToUpgradeTo)} feature!`}
        </p>
      </div>
      <p className="text-sm text-neutral-600">{message}</p>
      <Link
        href={slug ? `/${slug}/upgrade` : "https://pimms.io/pricing"}
        target="_blank"
        className="w-full rounded border border-blue-500 bg-[#3971ff] px-3 py-1.5 text-center text-sm text-white transition-all hover:ring-0 hover:ring-transparent"
      >
        {planToUpgradeTo ? `Upgrade to ${planToUpgradeTo}` : "Contact support"}
      </Link>
    </div>
  );
};
