"use client";

import useCustomersCount from "@/lib/swr/use-customers-count";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { CheckCircleFill, ThreeDots } from "@/ui/shared/icons";
import {
  Button,
  Popover,
  Tooltip,
  TooltipContent,
  useLocalStorage,
} from "@dub/ui";
import { CircleDotted, CrownSmall, ExpandingArrow } from "@dub/ui/icons";
import { fetcher } from "@dub/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { forwardRef, HTMLAttributes, Ref, useMemo, useState } from "react";
import useSWR from "swr";

export function OnboardingButton() {
  const [hideForever, setHideForever] = useLocalStorage(
    "onboarding-hide-forever",
    false,
  );

  return !hideForever ? (
    <OnboardingButtonInner onHideForever={() => setHideForever(true)} />
  ) : null;
}

function OnboardingButtonInner({
  onHideForever,
}: {
  onHideForever: () => void;
}) {
  const { slug } = useParams() as { slug: string };

  if (!slug) {
    return null;
  }

  const { totalLinks, totalClicks, salesUsage, plan } = useWorkspace({
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

  const tasks = useMemo(() => {
    return [
      {
        display: "Create a new link",
        cta: `/${slug}`,
        checked: totalLinks && totalLinks > 0,
      },
      {
        display: "Create one UTM template",
        cta: `/${slug}/settings/library/utm`,
        checked: utmTemplates && utmTemplates.length > 0,
      },
      {
        display: "Collect a first Click",
        cta: `/${slug}/analytics`,
        checked: totalClicks && totalClicks > 0,
      },
      {
        display: "Collect a first Lead",
        cta: `/${slug}/conversions`,
        checked: customersCount && customersCount > 0,
        premium: "starter",
        feature: "Lead tracking",
      },
      // {
      //   display: "Collect a first Sale",
      //   cta: `/${slug}/conversions`,
      //   checked: salesUsage && salesUsage > 0,
      //   premium: "pro",
      //   feature: "Sales tracking",
      // },
      {
        display: "Set up your custom domain",
        cta: `/${slug}/settings/domains`,
        checked: domainsCount && domainsCount > 0,
      },
      {
        display: "Invite your teammates",
        cta: `/${slug}/settings/people`,
        checked: (users && users.length > 1) || (invites && invites.length > 0),
      },
    ];
  }, [
    slug,
    domainsCount,
    totalLinks,
    totalClicks,
    customersCount,
    salesUsage,
    users,
    invites,
    utmTemplates,
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const completedTasks = tasks.filter((task) => task.checked).length;

  return loading || completedTasks === tasks.length ? null : (
    <Popover
      align="end"
      popoverContentClassName="rounded"
      content={
        <div>
          <div className="rounded-t-md bg-brand-primary p-4 text-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-lg font-medium">Getting Started</span>
              </div>
              <div className="flex items-center gap-1">
                <OnboardingMenu
                  onHideForever={() => {
                    onHideForever();
                    setIsOpen(false);
                  }}
                />
                <MiniButton onClick={() => setIsOpen(false)}>
                  <ChevronDown className="size-4" />
                </MiniButton>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid divide-y divide-neutral-100 rounded border border-neutral-100 bg-white">
              {tasks.map(({ display, cta, checked, premium, feature }) => {
                return (
                  <Link
                    key={display}
                    href={cta}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="group flex items-center justify-between gap-3 p-3 sm:gap-10">
                      <div className="flex items-center gap-2">
                        {checked ? (
                          <CheckCircleFill className="size-5 text-green-500" />
                        ) : (
                          <CircleDotted className="size-5 text-neutral-400" />
                        )}
                        <p className="inline-flex items-center gap-2 text-sm text-neutral-800">
                          {display}{" "}
                          {plan === "free" && premium && (
                            <Tooltip
                              content={
                                <TooltipContent
                                  title={`${feature} is only available on ${premium} plans and above.`}
                                  cta={`Upgrade to ${premium}`}
                                  href={`/${slug}/upgrade`}
                                />
                              }
                            >
                              <div className="inline-block">
                                <CrownSmall className="size-5 text-neutral-600 rounded-full border border-neutral-600" />
                              </div>
                            </Tooltip>
                          )}
                        </p>
                      </div>
                      <div className="mr-5">
                        <ExpandingArrow className="text-neutral-500" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      }
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
    >
      <button
        type="button"
        className="animate-slide-up-fade -mr-2 mt-1 flex h-12 flex-col items-center justify-center rounded-full bg-[#3970ff] px-6 text-sm font-medium leading-tight text-white shadow-md transition-all [--offset:10px] sm:mr-0"
      >
        <span>Getting Started</span>
        <span className="text-neutral-200">
          {Math.round((completedTasks / tasks.length) * 100)}% complete
        </span>
      </button>
    </Popover>
  );
}

const MiniButton = forwardRef(
  (props: HTMLAttributes<HTMLButtonElement>, ref: Ref<HTMLButtonElement>) => {
    return (
      <button
        ref={ref}
        type="button"
        {...props}
        className="rounded bg-white/20 px-1 py-1 text-neutral-100 transition-colors active:text-white"
      />
    );
  },
);

function OnboardingMenu({ onHideForever }: { onHideForever: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      align="end"
      content={
        <div className="p-1">
          <Button
            onClick={onHideForever}
            variant="outline"
            text="Dismiss forever"
            className="h-9"
          />
        </div>
      }
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
    >
      <MiniButton>
        <ThreeDots className="size-4" />
      </MiniButton>
    </Popover>
  );
}
