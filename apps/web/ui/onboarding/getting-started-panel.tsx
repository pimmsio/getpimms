"use client";

import useCustomersCount from "@/lib/swr/use-customers-count";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { CheckCircleFill } from "@/ui/shared/icons";
import { ModalContext } from "@/ui/modals/modal-provider";
import { CircleDotted, ExpandingArrow } from "@dub/ui/icons";
import { fetcher } from "@dub/utils";
import Link from "next/link";
import { useContext, useMemo } from "react";
import useSWR from "swr";

type Task = {
  display: string;
  description: string;
  cta: string;
  checked: boolean;
  onClick?: () => void;
};

export function GettingStartedPanel() {
  const { setShowConversionOnboardingModal, setShowLinkBuilder } = useContext(ModalContext);
  const { slug, totalLinks, totalClicks } = useWorkspace({
    swrOpts: {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  });

  const { data: domainsCount, loading: domainsLoading } = useDomainsCount({
    ignoreParams: true,
  });

  const { data: customersCount } = useCustomersCount();

  const { users, loading: usersLoading } = useUsers();
  const { users: invites, loading: invitesLoading } = useUsers({
    invites: true,
  });

  const { data: utmTemplates } = useSWR<UtmTemplateWithUserProps[]>(
    slug ? `/api/utm?workspaceId=${slug}` : null,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const loading = domainsLoading || usersLoading || invitesLoading;

  const tasks = useMemo<Task[]>(() => {
    if (!slug) return [];
    return [
      {
        display: "Create a new link",
        description: "Shorten a URL to start tracking clicks right away.",
        cta: `/${slug}`,
        checked: Boolean(totalLinks && totalLinks > 0),
        onClick: () => setShowLinkBuilder(true),
      },
      {
        display: "Get a Click",
        description: "Share a link and confirm traffic is coming in.",
        cta: `/${slug}/analytics`,
        checked: Boolean(totalClicks && totalClicks > 0),
      },
      {
        display: "Reveal a lead",
        description: "Create a link magnet or follow a setup guide.",
        cta: `/${slug}/conversions`,
        checked: Boolean(customersCount && customersCount > 0),
        onClick: () => setShowConversionOnboardingModal(true),
      },
      {
        display: "Create one UTM template",
        description: "Save UTMs once and reuse them for campaigns.",
        cta: `/${slug}/settings/utm/templates`,
        checked: Boolean(utmTemplates && utmTemplates.length > 0),
      },
      {
        display: "Setup a custom domain",
        description: "Use your brand domain for trusted links.",
        cta: `/${slug}/settings/domains`,
        checked: Boolean(domainsCount && domainsCount > 0),
      },
      {
        display: "Invite a teammate",
        description: "Add collaborators so everyone can access the workspace.",
        cta: `/${slug}/settings/people`,
        checked: Boolean(
          (users && users.length > 1) || (invites && invites.length > 0),
        ),
      },
    ];
  }, [
    slug,
    domainsCount,
    totalLinks,
    totalClicks,
    customersCount,
    users,
    invites,
    utmTemplates,
    setShowConversionOnboardingModal,
    setShowLinkBuilder,
  ]);

  const completedTasks = tasks.filter((task) => task.checked).length;

  if (!slug || loading || tasks.length === 0 || completedTasks === tasks.length) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-900">
            Getting Started
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {completedTasks}/{tasks.length} completed
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {tasks.map(({ display, description, cta, checked, onClick }) => {
          const content = (
            <div className="flex items-center justify-between gap-4 pl-4 pr-8 py-3 transition-colors group-hover:bg-neutral-50">
              <div className="flex min-w-0 items-start gap-3">
                {checked ? (
                  <CheckCircleFill className="mt-0.5 size-5 shrink-0 text-green-600 transition-colors" />
                ) : (
                  <CircleDotted className="mt-0.5 size-5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                    {display}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {description}
                  </div>
                </div>
              </div>
              <ExpandingArrow className="shrink-0 text-neutral-400 transition-all group-hover:text-neutral-600 group-hover:translate-x-0.5" />
            </div>
          );

          if (onClick) {
            return (
              <button
                key={display}
                type="button"
                onClick={onClick}
                className="group w-full text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {content}
              </button>
            );
          }

          return (
            <Link 
              key={display} 
              href={cta} 
              className="group transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
