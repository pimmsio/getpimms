"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWebhooks from "@/lib/swr/use-webhooks";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import EmptyState from "@/ui/shared/empty-state";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import WebhookCard from "@/ui/webhooks/webhook-card";
import WebhookPlaceholder from "@/ui/webhooks/webhook-placeholder";
import { Webhook } from "lucide-react";
import { useRouter } from "next/navigation";
import { text } from "@/ui/design/tokens";

export default function WebhooksPageClient() {
  const router = useRouter();
  const { slug, plan, role } = useWorkspace();
  const { openUpgradeModal } = useUpgradeModal();

  const { webhooks, isLoading } = useWebhooks();

  const { error: permissionsError } = clientAccessCheck({
    action: "webhooks.write",
    role: role,
  });

  const needsHigherPlan = plan === "free";

  if (needsHigherPlan) {
    return (
      <EmptyState
        icon={Webhook}
        title="Webhooks"
        description="Webhooks allow you to receive HTTP requests whenever a specific event (eg: someone clicked your link) occurs in PIMMS."
        buttonText="Upgrade to Pro"
        onButtonClick={openUpgradeModal}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap justify-between gap-6">
        <div className="flex items-center gap-x-2">
          <div className={text.pageTitle}>Webhooks</div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push(`/${slug}/settings/webhooks/new`)}
            disabled={!!permissionsError}
            title={typeof permissionsError === "string" ? permissionsError : undefined}
          >
            Create Webhook
          </AppButton>
        </div>
      </div>

      <div className="animate-fade-in">
        {!isLoading ? (
          webhooks && webhooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {webhooks.map((webhook) => (
                <WebhookCard {...webhook} key={webhook.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Webhook}
              title="You haven't set up any webhooks yet."
              description="Webhooks allow you to receive HTTP requests whenever a specific event (eg: someone clicked your link) occurs in PIMMS."
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <WebhookPlaceholder key={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
