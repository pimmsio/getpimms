"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { BackLink } from "@/ui/shared/back-link";
import AddEditWebhookForm from "@/ui/webhooks/add-edit-webhook-form";
import { redirect } from "next/navigation";

export default function NewWebhookPageClient({
  newSecret,
}: {
  newSecret: string;
}) {
  const { slug, plan } = useWorkspace();

  const needsHigherPlan = plan === "free";

  if (needsHigherPlan) {
    redirect(`/${slug}/settings/webhooks`);
  }

  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-6">
      <BackLink href={`/${slug}/settings/webhooks`}>Back to webhooks</BackLink>
      <AddEditWebhookForm webhook={null} newSecret={newSecret} />
    </div>
  );
}
