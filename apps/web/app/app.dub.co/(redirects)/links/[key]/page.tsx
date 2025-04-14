import { getDefaultWorkspace } from "@/lib/fetchers";
import { redirect } from "next/navigation";

export default async function OldLinksStatsPage({
  params,
}: {
  params: {
    key: string;
  };
}) {
  const defaultWorkspace = await getDefaultWorkspace();
  if (!defaultWorkspace) {
    redirect("/");
  }
  redirect(
    `/${defaultWorkspace.slug}/analytics?domain=pim.ms&key=${params.key}`,
  );
}
