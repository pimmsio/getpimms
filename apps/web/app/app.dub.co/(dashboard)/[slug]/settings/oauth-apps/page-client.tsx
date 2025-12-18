"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import { OAuthAppProps } from "@/lib/types";
import OAuthAppCard from "@/ui/oauth-apps/oauth-app-card";
import OAuthAppPlaceholder from "@/ui/oauth-apps/oauth-app-placeholder";
import { AppButton } from "@/ui/components/controls/app-button";
import { text } from "@/ui/design/tokens";
import EmptyState from "@/ui/shared/empty-state";
import { Cube } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { useRouter } from "next/navigation";
import useSWR from "swr";

export default function OAuthAppsPageClient() {
  const router = useRouter();
  const { slug, id: workspaceId, role } = useWorkspace();

  const { data: oAuthApps, isLoading } = useSWR<OAuthAppProps[]>(
    `/api/oauth/apps?workspaceId=${workspaceId}`,
    fetcher,
  );

  const { error: permissionsError } = clientAccessCheck({
    action: "oauth_apps.write",
    role,
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap justify-between gap-6">
        <div className="flex items-center gap-x-2">
          <div className={text.pageTitle}>OAuth Applications</div>
          {/* <InfoTooltip
            content={
              <TooltipContent
                title="Learn how to use OAuth applications to build integrations with PIMMS."
                href="https://dub.co/docs/integrations/quickstart"
                target="_blank"
                cta="Learn more"
              />
            }
          /> */}
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => router.push(`/${slug}/settings/oauth-apps/new`)}
            disabled={!!permissionsError}
            title={typeof permissionsError === "string" ? permissionsError : undefined}
          >
            Create OAuth App
          </AppButton>
        </div>
      </div>

      <div className="animate-fade-in">
        {!isLoading ? (
          oAuthApps && oAuthApps.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {oAuthApps.map((oAuthApp) => (
                <OAuthAppCard {...oAuthApp} key={oAuthApp.id} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-neutral-50/60 py-10">
              <EmptyState icon={Cube} title={"No OAuth applications found"} />
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <OAuthAppPlaceholder key={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
