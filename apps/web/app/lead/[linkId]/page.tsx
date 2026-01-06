import { Lock } from "@/ui/shared/icons";
import { NewBackground } from "@/ui/shared/new-background";
import { prismaEdge } from "@dub/prisma/edge";
import { BlurImage, Wordmark } from "@dub/ui";
import { constructMetadata, createHref, isDubDomain } from "@dub/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LeadMagnetForm from "./form";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const title = "Unlock this content";
const description = "Enter your email to continue.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const link = await prismaEdge.link.findUnique({
    where: { id: linkId },
    select: {
      domain: true,
      project: {
        select: {
          logo: true,
          plan: true,
        },
      },
    },
  });

  if (!link) notFound();

  return constructMetadata({
    title,
    description,
    noIndex: true,
    ...(!isDubDomain(link.domain) &&
      link.project?.plan !== "free" &&
      link.project?.logo && {
        icons: link.project.logo,
      }),
  });
}

export default async function LeadMagnetPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>;
  searchParams: Promise<{ cid?: string }>;
}) {
  const { linkId } = await params;
  const { cid } = await searchParams;

  const link = await prismaEdge.link.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      domain: true,
      key: true,
      url: true,
      shortLink: true,
      leadMagnetEnabled: true,
      project: {
        select: {
          name: true,
          logo: true,
          plan: true,
        },
      },
    },
  });

  if (!link) notFound();

  // Safety: if lead magnet is not enabled, fall back to normal behavior.
  if (!link.leadMagnetEnabled) {
    redirect(link.shortLink);
  }

  return (
    <>
      <NewBackground />
      <main className="relative mb-10 flex w-screen flex-col items-center">
        <Wordmark className="mt-6 h-8" />
        <div className="z-10 mt-8 w-full max-w-[420px] overflow-hidden rounded border border-neutral-100 shadow-sm md:mt-24">
          <div className="flex flex-col items-center justify-center gap-3 border-b border-neutral-100 bg-white px-4 py-6 text-center">
            {link.project?.logo ? (
              <BlurImage
                src={link.project.logo}
                alt={link.project.name}
                width={48}
                height={48}
                className="size-12 rounded-full"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
                <Lock className="size-4 text-neutral-600" />
              </div>
            )}
            <h3 className="mt-1 text-lg font-semibold">{title}</h3>
            <p className="w-full max-w-xs text-pretty text-sm text-neutral-500">
              {description}
            </p>
          </div>
          <LeadMagnetForm clickId={cid || ""} linkId={linkId} />
        </div>
        <Link
          href={createHref("/", link.domain, {
            utm_source: "Lead Magnet Page",
            utm_medium: "Lead Magnet Page",
            utm_campaign: link.domain,
            utm_content: "What is PIMMS?",
          })}
          target="_blank"
          className="mt-4 block text-sm font-medium text-neutral-600 underline transition-colors duration-75 hover:text-neutral-800"
        >
          What is PIMMS?
        </Link>
      </main>
    </>
  );
}


