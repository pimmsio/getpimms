import { redirect } from "next/navigation";

export default async function WrappedParentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/wrapped/2024`);
}
