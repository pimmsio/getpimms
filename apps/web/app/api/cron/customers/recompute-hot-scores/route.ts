import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { qstash } from "@/lib/cron";
import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import { verifyVercelSignature } from "@/lib/cron/verify-vercel";
import { prisma } from "@dub/prisma";
import { APP_DOMAIN_WITH_NGROK } from "@dub/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 30;
const BATCH_SIZE = 500;

const bodySchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  cursor: z
    .object({
      lastEventAt: z.string().datetime(),
      id: z.string().min(1),
    })
    .optional(),
});

// GET /api/cron/customers/recompute-hot-scores
// Intended to be triggered by Vercel Cron; it kicks off a QStash-backed batch run.
export async function GET(req: Request) {
  try {
    await verifyVercelSignature(req);

    const url = new URL(req.url);
    const days = Math.min(
      365,
      Math.max(1, Number(url.searchParams.get("days") || DEFAULT_DAYS)),
    );

    // Kick off via QStash (so heavy work isn't done in the Vercel cron request)
    await qstash.publishJSON({
      url: `${APP_DOMAIN_WITH_NGROK}/api/cron/customers/recompute-hot-scores`,
      method: "POST",
      body: { days },
    });

    return NextResponse.json({ ok: true, enqueued: true, days });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}

// POST /api/cron/customers/recompute-hot-scores
// QStash-driven batch processor that republishes per-customer recompute jobs.
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    await verifyQstashSignature({ req, rawBody });

    const parsed = bodySchema.parse(JSON.parse(rawBody || "{}"));
    const days = parsed.days ?? DEFAULT_DAYS;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const cursorTime = parsed.cursor ? new Date(parsed.cursor.lastEventAt) : null;
    const cursorId = parsed.cursor?.id;

    const whereCursor =
      cursorTime && cursorId
        ? {
            OR: [
              { lastEventAt: { gt: cursorTime } },
              { lastEventAt: cursorTime, id: { gt: cursorId } },
            ],
          }
        : {};

    // Process customers who were active recently.
    // (We intentionally recompute even if lastHotScoreAt is "recent" because scores decay over time.)
    const customers = await prisma.customer.findMany({
      where: {
        lastEventAt: { gte: cutoff },
        ...(whereCursor as any),
      },
      select: {
        id: true,
        projectId: true,
        lastEventAt: true,
      },
      orderBy: [{ lastEventAt: "asc" }, { id: "asc" }],
      take: BATCH_SIZE,
    });

    if (customers.length === 0) {
      return NextResponse.json({ ok: true, done: true, days });
    }

    await Promise.allSettled(
      customers.map((c) =>
        qstash.publishJSON({
          url: `${APP_DOMAIN_WITH_NGROK}/api/cron/customers/recompute-hot-score`,
          method: "POST",
          body: { workspaceId: c.projectId, customerId: c.id },
        }),
      ),
    );

    const last = customers[customers.length - 1];

    // Continue batching
    await qstash.publishJSON({
      url: `${APP_DOMAIN_WITH_NGROK}/api/cron/customers/recompute-hot-scores`,
      method: "POST",
      body: {
        days,
        cursor: {
          lastEventAt: last.lastEventAt?.toISOString() || new Date(0).toISOString(),
          id: last.id,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      enqueued: customers.length,
      days,
      nextCursor: {
        lastEventAt: last.lastEventAt?.toISOString() || null,
        id: last.id,
      },
    });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}

