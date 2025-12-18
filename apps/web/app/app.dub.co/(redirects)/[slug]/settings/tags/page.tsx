import { redirect } from "next/navigation";

export default async function OldWorkspaceTags({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/settings/library/tags`);
}
