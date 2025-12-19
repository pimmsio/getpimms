import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  interval: z.enum(["7d", "30d"]).default("7d"),
});

// GET /api/utm-coverage - UTM coverage for links created in the interval (used for onboarding)
export const GET = withWorkspace(async ({ workspace, searchParams }) => {
  const { interval } = querySchema.parse(searchParams);

  const now = new Date();
  const start =
    interval === "30d"
      ? new Date(now.getTime() - 30 * 86_400_000)
      : new Date(now.getTime() - 7 * 86_400_000);

  const [total, tagged] = await Promise.all([
    prisma.link.count({
      where: {
        projectId: workspace.id,
        createdAt: { gte: start, lte: now },
      },
    }),
    prisma.link.count({
      where: {
        projectId: workspace.id,
        createdAt: { gte: start, lte: now },
        OR: [
          { utm_source: { not: null } },
          { utm_medium: { not: null } },
          { utm_campaign: { not: null } },
          { utm_term: { not: null } },
          { utm_content: { not: null } },
        ],
      },
    }),
  ]);

  const coverage = total > 0 ? tagged / total : 0;

  return NextResponse.json({
    interval,
    totalLinks: total,
    taggedLinks: tagged,
    coverage, // 0..1
    coveragePct: Math.round(coverage * 100),
  });
});


