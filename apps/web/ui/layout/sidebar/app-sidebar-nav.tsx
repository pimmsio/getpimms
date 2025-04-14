"use client";

import usePrograms from "@/lib/swr/use-programs";
import { useRouterStuff } from "@dub/ui";
import {
  ConnectedDots,
  ConnectedDots4,
  Gear2,
  Gift,
  Globe,
  Key,
  ShieldCheck,
  Users6,
  Webhook,
} from "@dub/ui/icons";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { SidebarNav, SidebarNavAreas } from "./sidebar-nav";
import { Usage } from "./usage";
import { WorkspaceDropdown } from "./workspace-dropdown";
import { BarChart2, CoinsIcon, Link, Settings, Settings2, Split, Target, TargetIcon, WalletCards } from "lucide-react";
import { ReferralButton } from "./referral-button";

const NAV_AREAS: SidebarNavAreas<{
  slug: string;
  pathname: string;
  queryString: string;
  programs?: { id: string }[];
  session?: Session | null;
  showNews?: boolean;
}> = {
  // Top-level
  default: ({ slug, pathname, queryString, programs, showNews }) => ({
    showSwitcher: true,
    showNews,
    direction: "left",
    content: [
      {
        items: [
          {
            name: "Deep links",
            icon: Link,
            href: `/${slug}${pathname === `/${slug}` ? "" : queryString}`,
            exact: true,
          },
          {
            name: "Analytics",
            icon: BarChart2,
            href: `/${slug}/analytics${pathname === `/${slug}/analytics` ? "" : queryString}`,
          },
          {
            name: "Conversions",
            icon: Target,
            // href: `/${slug}/events${pathname === `/${slug}/events` ? "" : queryString}`,
            href: `/${slug}/leads?event=leads`,
          },
          {
            name: "Sales",
            icon: CoinsIcon,
            // href: `/${slug}/events${pathname === `/${slug}/events` ? "" : queryString}`,
            href: `/${slug}/sales?event=sales`,
          },
          {
            name: "Integrations",
            icon: ConnectedDots,
            href: `/${slug}/settings/integrations`,
          },
          {
            name: "Settings",
            icon: Settings2,
            href: `/${slug}/settings`,
          },
        ],
      },
      ...(programs?.length
        ? [
            {
              items: [
                {
                  name: "Affiliate",
                  icon: ConnectedDots4,
                  href: `/${slug}/programs/${programs[0].id}`,
                  items: [
                    {
                      name: "Overview",
                      href: `/${slug}/programs/${programs[0].id}`,
                      exact: true,
                    },
                    {
                      name: "Partners",
                      href: `/${slug}/programs/${programs[0].id}/partners`,
                    },
                    {
                      name: "Sales",
                      href: `/${slug}/programs/${programs[0].id}/sales`,
                    },
                    {
                      name: "Payouts",
                      href: `/${slug}/programs/${programs[0].id}/payouts`,
                    },
                    {
                      name: "Resources",
                      href: `/${slug}/programs/${programs[0].id}/resources`,
                    },
                    {
                      name: "Configuration",
                      href: `/${slug}/programs/${programs[0].id}/settings`,
                    },
                  ],
                },
              ],
            },
          ]
        : []),
    ],
  }),

  // Workspace settings
  workspaceSettings: ({ slug }) => ({
    title: "Settings",
    backHref: `/${slug}`,
    content: [
      {
        name: "Workspace",
        items: [
          {
            name: "General",
            icon: Settings,
            href: `/${slug}/settings`,
            exact: true,
          },
          {
            name: "Domains",
            icon: Globe,
            href: `/${slug}/settings/domains`,
          },
          {
            name: "UTM Templates",
            icon: Split,
            href: `/${slug}/settings/library`,
          },
          {
            name: "Conversions",
            icon: TargetIcon,
            href: `/${slug}/settings/analytics`,
          },
          {
            name: "People",
            icon: Users6,
            href: `/${slug}/settings/people`,
          },
          {
            name: "Billing",
            icon: WalletCards,
            href: `/${slug}/settings/billing`,
          },
          {
            name: "Integrations",
            icon: ConnectedDots,
            href: `/${slug}/settings/integrations`,
          },
          // {
          //   name: "Security",
          //   icon: ShieldCheck,
          //   href: `/${slug}/settings/security`,
          // },
        ],
      },
      {
        name: "Developer",
        items: [
          {
            name: "API Keys",
            icon: Key,
            href: `/${slug}/settings/tokens`,
          },
          // {
          //   name: "OAuth Apps",
          //   icon: CubeSettings,
          //   href: `/${slug}/settings/oauth-apps`,
          // },
          {
            name: "Webhooks",
            icon: Webhook,
            href: `/${slug}/settings/webhooks`,
          },
        ],
      },
      // {
      //   name: "Account",
      //   items: [
      //     {
      //       name: "Notifications",
      //       icon: CircleInfo,
      //       href: `/${slug}/settings/notifications`,
      //     },
      //   ],
      // },
    ],
  }),

  // User settings
  userSettings: ({ session, slug }) => ({
    title: "Settings",
    backHref: `/${slug}`,
    content: [
      {
        name: "Account",
        items: [
          {
            name: "General",
            icon: Gear2,
            href: "/account/settings",
            exact: true,
          },
          {
            name: "Security",
            icon: ShieldCheck,
            href: "/account/settings/security",
          },
          {
            name: "Referrals",
            icon: Gift,
            href: "/account/settings/referrals",
          },
        ],
      },
    ],
  }),
};

export function AppSidebarNav({
  toolContent,
  newsContent,
}: {
  toolContent?: ReactNode;
  newsContent?: ReactNode;
}) {
  const { slug } = useParams() as { slug?: string };
  const pathname = usePathname();
  const { getQueryString } = useRouterStuff();
  const { data: session } = useSession();
  const { programs } = usePrograms();

  const currentArea = useMemo(() => {
    return pathname.startsWith("/account/settings")
      ? "userSettings"
      : pathname.startsWith(`/${slug}/settings`)
        ? "workspaceSettings"
        : "default";
  }, [slug, pathname]);

  return (
    <SidebarNav
      areas={NAV_AREAS}
      currentArea={currentArea}
      data={{
        slug: slug || "",
        pathname,
        queryString: getQueryString(undefined, {
          include: ["folderId", "tagIds"],
        }),
        programs,
        session: session || undefined,
        showNews: pathname.startsWith(`/${slug}/programs/`) ? false : true,
      }}
      toolContent={toolContent}
      newsContent={newsContent}
      switcher={<WorkspaceDropdown />}
      bottom={
        <>
          <ReferralButton />
          {/* <UserSurveyButton /> */}
          <Usage />
        </>
      }
    />
  );
}
