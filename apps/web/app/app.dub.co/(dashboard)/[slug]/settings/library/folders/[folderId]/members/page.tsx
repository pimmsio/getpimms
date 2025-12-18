import { FolderUsersPageClient } from "./page-client";

export default async function FolderUsersPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;

  return <FolderUsersPageClient folderId={folderId} />;
}
