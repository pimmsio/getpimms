"use client";

import { useRouterStuff } from "@dub/ui";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { PartnerProgramDropdown } from "./partner-program-dropdown";
import { PayoutStats } from "./payout-stats";
import { ProgramHelpSupport } from "./program-help-support";
import { SidebarNav, SidebarNavAreas } from "./sidebar-nav";
import {
  PimmsAnalyticsIcon,
  PimmsGaugeIcon,
  PimmsGlobeIcon,
  PimmsGridIcon,
  PimmsLinksIcon,
  PimmsMoneyIcon,
  PimmsSettingsIcon,
  PimmsShieldIcon,
  PimmsStoreIcon,
  PimmsUserIcon,
  PimmsUsersIcon,
} from "./icons/pimms-sidebar-icons";

const NAV_AREAS: SidebarNavAreas<{
  programSlug?: string;
  queryString?: string;
}> = {
  // Top-level
  default: () => ({
    showSwitcher: true,
    showNews: true,
    direction: "left",
    content: [
      {
        items: [
          {
            name: "Programs",
            icon: PimmsGridIcon,
            href: "/programs",
            exact: true,
          },
          {
            name: "Marketplace",
            icon: PimmsStoreIcon,
            href: "/marketplace",
          },
          {
            name: "Settings",
            icon: PimmsSettingsIcon,
            href: "/settings",
          },
        ],
      },
    ],
  }),

  program: ({ programSlug, queryString }) => ({
    showSwitcher: true,
    content: [
      {
        items: [
          {
            name: "Overview",
            icon: PimmsGaugeIcon,
            href: `/programs/${programSlug}`,
            exact: true,
          },
          {
            name: "Earnings",
            icon: PimmsMoneyIcon,
            href: `/programs/${programSlug}/earnings${queryString}`,
          },
          {
            name: "Links",
            icon: PimmsLinksIcon,
            href: `/programs/${programSlug}/links`,
          },
          {
            name: "Analytics",
            icon: PimmsAnalyticsIcon,
            href: `/programs/${programSlug}/analytics`,
          },
          {
            name: "Resources",
            icon: PimmsGlobeIcon,
            href: `/programs/${programSlug}/resources`,
          },
        ],
      },
    ],
  }),

  partnerSettings: () => ({
    title: "Settings",
    backHref: "/programs",
    content: [
      {
        name: "Partner",
        items: [
          {
            name: "Profile",
            icon: PimmsUserIcon,
            href: "/settings",
            exact: true,
          },
          {
            name: "Payouts",
            icon: PimmsMoneyIcon,
            href: "/settings/payouts",
          },
          {
            name: "People",
            icon: PimmsUsersIcon,
            href: "/settings/people",
          },
        ],
      },
    ],
  }),

  // User settings
  userSettings: () => ({
    title: "Settings",
    backHref: "/programs",
    content: [
      {
        name: "Account",
        items: [
          {
            name: "General",
            icon: PimmsSettingsIcon,
            href: "/account/settings",
            exact: true,
          },
          {
            name: "Security",
            icon: PimmsShieldIcon,
            href: "/account/settings/security",
          },
        ],
      },
    ],
  }),
};

export function PartnersSidebarNav({
  toolContent,
  newsContent,
}: {
  toolContent?: ReactNode;
  newsContent?: ReactNode;
}) {
  const { programSlug } = useParams() as {
    programSlug?: string;
  };
  const pathname = usePathname();
  const { getQueryString } = useRouterStuff();

  const currentArea = useMemo(() => {
    return pathname.startsWith("/account/settings")
      ? "userSettings"
      : pathname.startsWith("/settings")
        ? "partnerSettings"
        : pathname.startsWith(`/programs/${programSlug}`)
          ? "program"
          : "default";
  }, [pathname, programSlug]);

  return (
    <SidebarNav
      areas={NAV_AREAS}
      currentArea={currentArea}
      data={{
        programSlug: programSlug || "",
        queryString: getQueryString(),
      }}
      toolContent={toolContent}
      newsContent={newsContent}
      switcher={<PartnerProgramDropdown />}
      bottom={
        <>
          {programSlug && <ProgramHelpSupport />}
          <PayoutStats />
        </>
      }
    />
  );
}
