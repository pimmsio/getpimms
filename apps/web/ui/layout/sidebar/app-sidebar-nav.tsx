"use client";

import { useAnalyticsUrl } from "@/lib/hooks/use-analytics-url";
import useWorkspace from "@/lib/swr/use-workspace";
import { borders } from "@/ui/design/tokens";
import { useRouterStuff } from "@dub/ui";
import { cn } from "@dub/utils";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { HelpButton } from "./help-button";
import { SettingsLink } from "./settings-link";
import { SidebarNav, SidebarNavAreas } from "./sidebar-nav";
import { Usage } from "./usage";
import { WorkspaceDropdown } from "./workspace-dropdown";

const NAV_AREAS: SidebarNavAreas<{
  slug: string;
  pathname: string;
  queryString: string;
  buildAnalyticsUrl: (
    basePath: string,
    additionalParams?: Record<string, string>,
  ) => string;
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
            href: `/${slug}/today`,
            exact: true,
          },
          {
            name: "Links",
            href: `/${slug}/links${pathname === `/${slug}/links` ? "" : queryString}`,
            exact: true,
          },
          {
            name: "Analytics",
            href: buildAnalyticsUrl(`/${slug}/analytics`),
          },
          {
            name: "Lead Signals",
            href: buildAnalyticsUrl(`/${slug}/conversions`, { event: "leads" }),
          },
          {
            name: "Reporting",
            href: buildAnalyticsUrl(`/${slug}/insights`),
          },
        ],
      },
      {
        name: "Customize",
        items: [
          {
            name: "UTM parameters",
            href: `/${slug}/settings/utm/parameters`,
          },
          {
            name: "UTM templates",
            href: `/${slug}/settings/utm/templates`,
          },
          {
            name: "Custom domains",
            href: `/${slug}/settings/domains`,
          },
        ],
      },
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
            href: `/${slug}/settings`,
            exact: true,
          },
          {
            name: "Tracking",
            href: `/${slug}/settings/analytics`,
          },
          {
            name: "People",
            href: `/${slug}/settings/people`,
          },
          {
            name: "Billing",
            href: `/${slug}/settings/billing`,
          },
          {
            name: "Integrations",
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
            href: `/${slug}/settings/tokens`,
          },
          // {
          //   name: "OAuth Apps",
          //   icon: CubeSettings,
          //   href: `/${slug}/settings/oauth-apps`,
          // },
          {
            name: "Webhooks",
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
            href: "/account/settings",
            exact: true,
          },
          {
            name: "Security",
            href: "/account/settings/security",
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
        session: session || undefined,
        showNews: true,
        plan,
      }}
      toolContent={toolContent}
      newsContent={newsContent}
      switcher={<WorkspaceDropdown />}
      bottom={
        <div className={cn("relative pt-3", borders.topHairline)}>
          <div className="flex flex-col gap-2 px-3 pb-3 sm:gap-2.5">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-2">
              <SettingsLink />
              <HelpButton />
            </div>
          </div>
          <Usage />
        </div>
      }
    />
  );
}
