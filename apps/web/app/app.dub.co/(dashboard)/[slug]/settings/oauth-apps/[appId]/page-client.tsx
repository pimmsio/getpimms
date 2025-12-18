"use client";

import { generateClientSecret } from "@/lib/actions/generate-client-secret";
import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import { OAuthAppProps } from "@/lib/types";
import { useRemoveOAuthAppModal } from "@/ui/modals/remove-oauth-app-modal";
import { useSubmitOAuthAppModal } from "@/ui/modals/submit-oauth-app-modal";
import AddOAuthAppForm from "@/ui/oauth-apps/add-edit-app-form";
import OAuthAppCredentials from "@/ui/oauth-apps/oauth-app-credentials";
import { BackLink } from "@/ui/shared/back-link";
import { ThreeDots } from "@/ui/shared/icons";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import {
  BlurImage,
  Popover,
  TokenAvatar,
} from "@dub/ui";
import { cn, fetcher } from "@dub/utils";
import { RefreshCcw, Trash, Upload } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { notFound, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function OAuthAppManagePageClient({ appId }: { appId: string }) {
  const searchParams = useSearchParams();
  const { slug, id: workspaceId, role } = useWorkspace();
  const [openPopover, setOpenPopover] = useState(false);
  const { executeAsync, result, isPending } = useAction(generateClientSecret, {
    onSuccess: () => {
      toast.success("New client secret generated.");
    },
    onError: ({ error }) => {
      toast.error(error.serverError);
    },
  });

  const { data: oAuthApp, isLoading } = useSWR<OAuthAppProps>(
    `/api/oauth/apps/${appId}?workspaceId=${workspaceId}`,
    fetcher,
  );

  const { RemoveOAuthAppModal, setShowRemoveOAuthAppModal } =
    useRemoveOAuthAppModal({
      oAuthApp,
    });

  const { SubmitOAuthAppModal, setShowSubmitOAuthAppModal } =
    useSubmitOAuthAppModal({
      oAuthApp,
    });

  const { error: permissionsError } = clientAccessCheck({
    action: "oauth_apps.write",
    role,
  });

  if (!isLoading && !oAuthApp) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-6">
      <RemoveOAuthAppModal />
      <SubmitOAuthAppModal />

      <BackLink href={`/${slug}/settings/oauth-apps`}>Back to OAuth Apps</BackLink>

      <div className="flex justify-between gap-2 sm:items-center">
        {isLoading ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-fit flex-none rounded-lg bg-neutral-50 p-2">
              <TokenAvatar id="placeholder-oauth-app" className="size-8" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded-full bg-neutral-100"></div>
              <div className="h-3 w-40 rounded-full bg-neutral-100"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-fit flex-none rounded-lg bg-neutral-50 p-2">
              {oAuthApp?.logo ? (
                <BlurImage
                  src={oAuthApp.logo}
                  alt={`Logo for ${oAuthApp.name}`}
                  className="size-8 rounded-full"
                  width={20}
                  height={20}
                />
              ) : (
                <TokenAvatar id={oAuthApp?.clientId!} className="size-8" />
              )}
            </div>
            <div>
              <p className="font-semibold text-neutral-700">{oAuthApp?.name}</p>
              <p className="text-pretty text-sm text-neutral-500">
                {oAuthApp?.description}
              </p>
            </div>
          </div>
        )}

        <Popover
          content={
            <div className="grid w-screen gap-px p-2 sm:w-48">
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                className="w-full justify-start px-2 font-medium"
                disabled={isPending}
                onClick={async () => {
                  await executeAsync({
                    workspaceId: workspaceId!,
                    appId,
                  });
                  setOpenPopover(false);
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isPending ? "Regenerating..." : "Regenerate secret"}
              </AppButton>
              {!oAuthApp?.verified && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start px-2"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowSubmitOAuthAppModal(true);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Submit for review
                </AppButton>
              )}
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                className="w-full justify-start px-2 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setShowRemoveOAuthAppModal(true);
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Remove application
              </AppButton>
            </div>
          }
          align="end"
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
        >
          <AppIconButton
            type="button"
            className="h-9 w-9"
            onClick={() => setOpenPopover(!openPopover)}
            disabled={!!permissionsError}
            title={typeof permissionsError === "string" ? permissionsError : undefined}
          >
            <ThreeDots className="h-5 w-5 shrink-0 text-neutral-500" />
          </AppIconButton>
        </Popover>
      </div>

      <div className="border-t border-neutral-100 pt-6">
        {oAuthApp && (
          <div className="space-y-6">
            <OAuthAppCredentials
              clientId={oAuthApp.clientId}
              clientSecret={
                result.data?.clientSecret ||
                searchParams.get("client_secret") ||
                null
              }
              partialClientSecret={oAuthApp.partialClientSecret}
            />
            <AddOAuthAppForm oAuthApp={oAuthApp} />
          </div>
        )}
      </div>
    </div>
  );
}
