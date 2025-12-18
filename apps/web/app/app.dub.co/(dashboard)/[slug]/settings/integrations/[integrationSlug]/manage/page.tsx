import AddEditIntegrationForm from "@/ui/oauth-apps/add-edit-integration-form";
import { BackLink } from "@/ui/shared/back-link";
import { prisma } from "@dub/prisma";
import { notFound } from "next/navigation";

export default async function IntegrationManagePage({
  params,
}: {
  params: Promise<{ slug: string; integrationSlug: string }>;
}) {
  const { slug, integrationSlug } = await params;
  // this is only available for PiMMs workspace for now
  // we might open this up to other workspaces in the future
  if (slug !== "pimms" && slug !== "pimms-staging") {
    notFound();
  }
  const integration = await prisma.integration.findUnique({
    where: {
      slug: integrationSlug,
    },
  });
  if (!integration) {
    notFound();
  }
  return (
    <div className="mx-auto grid w-full max-w-screen-lg gap-8">
      <BackLink href={`/${slug}/settings/integrations`}>
        Back to integrations
      </BackLink>

      <AddEditIntegrationForm
        integration={{
          ...integration,
          screenshots: integration.screenshots as string[],
        }}
      />
    </div>
  );
}
