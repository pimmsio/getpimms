import { PageContent } from "@/ui/layout/page-content";
import { getFeatureFlags } from "@/lib/edge-config/get-feature-flags";
import { LinksTitle } from "./links-title";
import WorkspaceLinksClient from "./page-client";

export default async function WorkspaceLinks({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const flags = await getFeatureFlags({ workspaceSlug: slug });
  return (
    <PageContent
      title={<LinksTitle linkFoldersEnabled={flags.linkFolders} />}
      headerPlacement="content"
    >
      <WorkspaceLinksClient />
    </PageContent>
  );
}
