import { redirect } from "next/navigation";

export default async function WorkspaceUtmTemplatesRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/settings/utm/templates`);
}
