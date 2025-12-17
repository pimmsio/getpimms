import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import { redis } from "@/lib/upstash";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  customerId: z.string().min(1),
});

/*
  POST /api/cron/customers/recompute-hot-score
  QStash job to recompute a single customer's hot score.
*/
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    await verifyQstashSignature({ req, rawBody });

    const { workspaceId, customerId } = bodySchema.parse(JSON.parse(rawBody));

    // Prevent recompute storms (e.g. rapid clicks)
    const dedupeKey = `hotScoreRecompute:${workspaceId}:${customerId}`;
    const ok = await redis.set(dedupeKey, 1, { nx: true, ex: 60 });
    if (!ok) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const hotScore = await computeCustomerHotScore(customerId, workspaceId);

    await prisma.customer.updateMany({
      where: {
        id: customerId,
        projectId: workspaceId,
      },
      data: {
        hotScore,
        lastHotScoreAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, hotScore });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}

