"use client";

import useCustomersCount from "@/lib/swr/use-customers-count";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { CheckCircleFill, ThreeDots } from "@/ui/shared/icons";
import { AppButton } from "@/ui/components/controls/app-button";
import { ModalContext } from "@/ui/modals/modal-provider";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import {
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
import { useContext, forwardRef, HTMLAttributes, Ref, useMemo, useState } from "react";
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
  const { openUpgradeModal } = useUpgradeModal();
  const { setShowConversionOnboardingModal } = useContext(ModalContext);

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
        display: "Get a Click",
        cta: `/${slug}/analytics`,
        checked: totalClicks && totalClicks > 0,
      },
      {
        display: "Reveal a lead",
        cta: `/${slug}/conversions`,
        checked: customersCount && customersCount > 0,
        onClick: () => setShowConversionOnboardingModal(true),
        // Tracking is available on all plans; keep as a normal onboarding task.
      },
      {
        display: "Create one UTM template",
        cta: `/${slug}/settings/utm/templates`,
        checked: utmTemplates && utmTemplates.length > 0,
      },
      // {
      //   display: "Collect a first Sale",
      //   cta: `/${slug}/conversions`,
      //   checked: salesUsage && salesUsage > 0,
      //   premium: "pro",
      //   feature: "Sales tracking",
      // },
      {
        display: "Setup a custom domain",
        cta: `/${slug}/settings/domains`,
        checked: domainsCount && domainsCount > 0,
      },
      {
        display: "Invite a teammate",
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
    setShowConversionOnboardingModal,
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
              {tasks.map(({ display, cta, checked, premium, feature, onClick }: any) => {
                const content = (
                  <div className="group flex items-center justify-between gap-3 p-3 sm:gap-10">
                    <div className="flex items-center gap-2">
                      {checked ? (
                        <CheckCircleFill className="size-5 text-green-600" />
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
                                onClick={openUpgradeModal}
                              />
                            }
                          >
                            <div className="inline-block">
                              <CrownSmall className="size-5 rounded-md border border-neutral-300 text-neutral-600" />
                            </div>
                          </Tooltip>
                        )}
                      </p>
                    </div>
                    <div className="mr-2">
                      <ExpandingArrow className="text-neutral-500" />
                    </div>
                  </div>
                );

                if (onClick) {
                  return (
                    <button
                      key={display}
                      type="button"
                      onClick={() => {
                        onClick();
                        setIsOpen(false);
                      }}
                      className="w-full text-left"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={display}
                    href={cta}
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
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
      <AppButton type="button" variant="primary" size="md" className="w-auto px-4 leading-tight">
        <span className="flex flex-col items-center">
          <span>Getting Started</span>
          <span className="text-[11px] font-medium text-white/80">
            {Math.round((completedTasks / tasks.length) * 100)}% complete
          </span>
        </span>
      </AppButton>
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
          <AppButton
            type="button"
            onClick={onHideForever}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            Dismiss forever
          </AppButton>
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
