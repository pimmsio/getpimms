"use client";

import { useAnalyticsUrl } from "@/lib/hooks/use-analytics-url";
import useWorkspace from "@/lib/swr/use-workspace";
import { useRouterStuff } from "@dub/ui";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { FreeAccountSection } from "./free-account-section";
import { HelpButton } from "./help-button";
import { ReferralButton } from "./referral-button";
import { SettingsLink } from "./settings-link";
import { SidebarNav, SidebarNavAreas } from "./sidebar-nav";
import { Usage } from "./usage";
import { WorkspaceDropdown } from "./workspace-dropdown";
import {
  Activity,
  CreditCard,
  Gift,
  KeyRound,
  Plug,
  Settings2,
  Shield,
  Users,
  Webhook,
} from "lucide-react";
import {
  PimmsAffiliateIcon,
  PimmsAnalyticsIcon,
  PimmsFlameIcon,
  PimmsGlobeIcon,
  PimmsLinksIcon,
  PimmsReportIcon,
  PimmsTemplatesIcon,
  PimmsTodayIcon,
  PimmsUtmParamsIcon,
} from "./icons/pimms-sidebar-icons";
// import { ReferralButton } from "./referral-button";

const NAV_AREAS: SidebarNavAreas<{
  slug: string;
  pathname: string;
  queryString: string;
  buildAnalyticsUrl: (
    basePath: string,
    additionalParams?: Record<string, string>,
  ) => string;
  programs?: { id: string }[];
  session?: Session | null;
  showNews?: boolean;
  plan?: string;
}> = {
  // Top-level
  default: ({
    slug,
    pathname,
    queryString,
    buildAnalyticsUrl,
    programs,
    showNews,
    plan,
  }) => ({
    showSwitcher: true,
    showNews,
    direction: "left",
    content: [
      {
        items: [
          {
            name: "Today",
            icon: PimmsTodayIcon,
            href: `/${slug}/today`,
            exact: true,
          },
          {
            name: "Links",
            icon: PimmsLinksIcon,
            href: `/${slug}/links${pathname === `/${slug}/links` ? "" : queryString}`,
            exact: true,
          },
          {
            name: "Analytics",
            icon: PimmsAnalyticsIcon,
            href: buildAnalyticsUrl(`/${slug}/analytics`),
          },
          {
            name: "Lead Signals",
            icon: PimmsFlameIcon,
            href: buildAnalyticsUrl(`/${slug}/conversions`, { event: "leads" }),
          },
          {
            name: "Reporting",
            icon: PimmsReportIcon,
            href: buildAnalyticsUrl(`/${slug}/insights`),
          },
        ],
      },
      {
        name: "Customize",
        items: [
          {
            name: "UTM parameters",
            icon: PimmsUtmParamsIcon,
            href: `/${slug}/settings/utm/parameters`,
          },
          {
            name: "UTM templates",
            icon: PimmsTemplatesIcon,
            href: `/${slug}/settings/utm/templates`,
          },
          {
            name: "Custom domains",
            icon: PimmsGlobeIcon,
            href: `/${slug}/settings/domains`,
          },
        ],
      },
      ...(programs?.length
        ? [
            {
              items: [
                {
                  name: "Affiliate",
                  icon: PimmsAffiliateIcon,
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
            icon: Settings2,
            href: `/${slug}/settings`,
            exact: true,
          },
          {
            name: "Tracking",
            icon: Activity,
            href: `/${slug}/settings/analytics`,
          },
          {
            name: "People",
            icon: Users,
            href: `/${slug}/settings/people`,
          },
          {
            name: "Billing",
            icon: CreditCard,
            href: `/${slug}/settings/billing`,
          },
          {
            name: "Integrations",
            icon: Plug,
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
            icon: KeyRound,
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
            icon: Settings2,
            href: "/account/settings",
            exact: true,
          },
          {
            name: "Security",
            icon: Shield,
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
  const { plan } = useWorkspace();
  const pathname = usePathname();
  const { getQueryString } = useRouterStuff();
  const { data: session } = useSession();
  // const { programs } = usePrograms();

  const currentArea = useMemo(() => {
    const isCustomizePath =
      !!slug &&
      (pathname.startsWith(`/${slug}/settings/utm`) ||
        pathname.startsWith(`/${slug}/settings/domains`));

    return pathname.startsWith("/account/settings")
      ? "userSettings"
      : isCustomizePath
        ? "default"
      : pathname.startsWith(`/${slug}/settings`)
        ? "workspaceSettings"
        : "default";
  }, [slug, pathname]);

  // Use centralized analytics URL builder
  const buildAnalyticsUrl = useAnalyticsUrl();

  return (
    <SidebarNav
      areas={NAV_AREAS}
      currentArea={currentArea}
      data={{
        slug: slug || "",
        pathname,
        queryString: getQueryString(undefined, {
          include: [
            "folderId",
            "tagIds",
            "domain",
            "key",
            "url",
            "country",
            "city",
            "region",
            "continent",
            "device",
            "browser",
            "os",
            "trigger",
            "referer",
            "refererUrl",
            "channel",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "customerId",
          ],
        }),
        buildAnalyticsUrl,
        // programs,
        session: session || undefined,
        showNews: pathname.startsWith(`/${slug}/programs/`) ? false : true,
        plan,
      }}
      toolContent={toolContent}
      newsContent={newsContent}
      switcher={<WorkspaceDropdown />}
      bottom={
        <>
          <FreeAccountSection />
          <div className="relative border-t border-neutral-200/80 pt-3">
            <div className="flex flex-col gap-2 px-3 pb-3 sm:gap-2.5">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-2">
                <ReferralButton className="sm:col-span-2" />
                <SettingsLink />
                <HelpButton />
              </div>
            </div>
            <Usage />
          </div>
        </>
      }
    />
  );
}
