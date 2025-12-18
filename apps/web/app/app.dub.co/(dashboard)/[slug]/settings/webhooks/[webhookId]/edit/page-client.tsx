"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { WebhookProps } from "@/lib/types";
import AddEditWebhookForm from "@/ui/webhooks/add-edit-webhook-form";
import { fetcher } from "@dub/utils";
import { notFound } from "next/navigation";
import useSWR from "swr";

export default function UpdateWebhookPageClient({
  webhookId,
}: {
  webhookId: string;
}) {
  const { id: workspaceId } = useWorkspace();

  const { data: webhook, isLoading } = useSWR<WebhookProps>(
    `/api/webhooks/${webhookId}?workspaceId=${workspaceId}`,
    fetcher,
  );

  if (!isLoading && !webhook) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-6">
      {webhook && <AddEditWebhookForm webhook={webhook} />}
    </div>
  );
}
