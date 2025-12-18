import { getDefaultWorkspace } from "@/lib/fetchers";
import { redirect } from "next/navigation";

export default async function OldLinksAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const awaitedSearchParams = await searchParams;
  const defaultWorkspace = await getDefaultWorkspace();
  if (!defaultWorkspace) {
    redirect("/");
  }

  const newParams = new URLSearchParams();
  if (awaitedSearchParams.domain) {
    newParams.set("domain", awaitedSearchParams.domain);
  }
  if (awaitedSearchParams.key) {
    newParams.set("key", awaitedSearchParams.key);
  }
  const queryString = newParams.toString();

  redirect(
    `/${defaultWorkspace.slug}/analytics${queryString ? `?${queryString}` : ""}`,
  );
}
