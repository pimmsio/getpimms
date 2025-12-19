import { withWorkspace } from "@/lib/auth";
import { redis } from "@/lib/upstash";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

type ClickFeedItem = {
  timestamp: string;
  clickId: string;
  linkId: string;
  domain: string;
  key: string;
  device?: string | null;
  referer?: string | null;
  identityHash?: string | null;
};

// GET /api/click-feed - recent click activity for the current workspace (used for onboarding)
export const GET = withWorkspace(async ({ workspace, searchParams }) => {
  const { limit } = querySchema.parse(searchParams);

  const listKey = `workspace:click-feed:${workspace.id}`;
  const rawItems = (await redis.lrange(listKey, 0, limit - 1)) as unknown as
    | string[]
    | null;

  const parsed = (rawItems || [])
    .map((s) => {
      try {
        return JSON.parse(s) as ClickFeedItem;
      } catch {
        return null;
      }
    })
    .filter((d): d is ClickFeedItem => Boolean(d));

  const identityHashes = Array.from(
    new Set(parsed.map((d) => d.identityHash).filter(Boolean)),
  ) as string[];

  const customers =
    identityHashes.length > 0
      ? await prisma.customer.findMany({
          where: {
            projectId: workspace.id,
            anonymousId: { in: identityHashes },
          },
          select: {
            id: true,
            name: true,
            email: true,
            anonymousId: true,
          },
          take: 50,
        })
      : [];

  const customerByAnon = new Map(customers.map((c) => [c.anonymousId, c]));

  return NextResponse.json({
    hasRealData: parsed.length > 0,
    items: parsed.map((it) => {
      const customer = it.identityHash ? customerByAnon.get(it.identityHash) : null;
      return {
        ...it,
        customer: customer
          ? { id: customer.id, name: customer.name, email: customer.email }
          : null,
      };
    }),
  });
});


