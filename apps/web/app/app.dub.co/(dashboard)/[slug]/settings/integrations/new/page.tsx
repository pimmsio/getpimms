import AddEditIntegrationForm from "@/ui/oauth-apps/add-edit-integration-form";
import { BackLink } from "@/ui/shared/back-link";
import { notFound } from "next/navigation";

export default async function NewIntegrationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // this is only available for PiMMs workspace for now
  // we might open this up to other workspaces in the future
  if (slug !== "pimms" && slug !== "pimms-staging") {
    notFound();
  }
  return (
    <div className="mx-auto grid w-full max-w-screen-lg gap-8">
      <BackLink href={`/${slug}/settings/integrations`}>
        Back to integrations
      </BackLink>

      <AddEditIntegrationForm
        integration={{
          name: "",
          slug: "",
          description: "",
          readme: "",
          developer: "",
          website: "",
          logo: null,
          projectId: "",
          screenshots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
      />
    </div>
  );
}
