import { Wordmark } from "@dub/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import WrappedPageClient from "./client";

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ slug: string; year: string }>;
}) {
  const { slug, year } = await params;
  if (year !== "2024") {
    redirect(`/${slug}`);
  }

  return (
    <div className="relative flex flex-col items-center">
      <Link href={`/${slug}`}>
        <Wordmark className="mt-6 h-8" />
      </Link>
      <WrappedPageClient />
    </div>
  );
}
