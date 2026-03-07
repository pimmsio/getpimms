import { createId } from "@/lib/api/create-id";
import { withWorkspace } from "@/lib/auth";
import {
  getUtmParameterLibraryCount,
  getUtmLimitsForPlan,
} from "@/lib/utm/limits";
import { bulkCreateUtmParametersBodySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { INFINITY_NUMBER, normalizeUtmValue } from "@dub/utils";
import { NextResponse } from "next/server";
import { DubApiError } from "@/lib/api/errors";

const MODEL_CONFIG = {
  source: { model: "utmSource", prefix: "utm_src_" },
  medium: { model: "utmMedium", prefix: "utm_med_" },
  campaign: { model: "utmCampaign", prefix: "utm_cmp_" },
  term: { model: "utmTerm", prefix: "utm_trm_" },
  content: { model: "utmContent", prefix: "utm_cnt_" },
} as const;

type UtmParamType = keyof typeof MODEL_CONFIG;

function getPrismaDelegate(type: UtmParamType) {
  const key = MODEL_CONFIG[type].model;
  return prisma[key] as any;
}

// POST /api/utm-parameters/bulk – bulk create UTM parameters
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { type, names } = bulkCreateUtmParametersBodySchema.parse(
      await req.json(),
    );

    const conventions = {
      spaceChar: workspace.utmSpaceChar ?? "-",
      prohibitedChars: workspace.utmProhibitedChars ?? "",
      forceLowercase: workspace.utmForceLowercase ?? true,
    };

    // Normalize and filter out names that become empty after normalization
    const allNormalized = names
      .map((n) => normalizeUtmValue(n, conventions))
      .filter(Boolean);

    // Count duplicates within the input itself
    const seen = new Set<string>();
    let duplicatesInInput = 0;
    const uniqueNames: string[] = [];
    for (const name of allNormalized) {
      if (seen.has(name)) {
        duplicatesInInput++;
      } else {
        seen.add(name);
        uniqueNames.push(name);
      }
    }

    const delegate = getPrismaDelegate(type);
    const { prefix } = MODEL_CONFIG[type];

    // Find which names already exist in the database
    const existing = await delegate.findMany({
      where: {
        projectId: workspace.id,
        name: { in: uniqueNames },
      },
      select: { name: true },
    });
    const existingSet = new Set(
      (existing as { name: string }[]).map((e) => e.name),
    );

    const newNames = uniqueNames.filter((n) => !existingSet.has(n));
    const alreadyExist = existingSet.size;

    if (newNames.length === 0) {
      return NextResponse.json(
        {
          created: 0,
          duplicatesInInput,
          alreadyExist,
        },
        { headers },
      );
    }

    // Check plan limits before creating
    const { planName, parameterLimit } = getUtmLimitsForPlan(workspace.plan);
    if (parameterLimit < INFINITY_NUMBER) {
      const currentTotal = await getUtmParameterLibraryCount(workspace.id);
      if (currentTotal + newNames.length > parameterLimit) {
        throw new DubApiError({
          code: "exceeded_limit",
          message: `Adding ${newNames.length} parameters would exceed your limit of ${parameterLimit} on the ${planName} plan. You can add ${Math.max(0, parameterLimit - currentTotal)} more.`,
        });
      }
    }

    const data = newNames.map((name) => ({
      id: createId({ prefix }),
      name,
      projectId: workspace.id,
    }));

    await delegate.createMany({ data, skipDuplicates: true });

    return NextResponse.json(
      {
        created: newNames.length,
        duplicatesInInput,
        alreadyExist,
      },
      { headers, status: 201 },
    );
  },
  {
    requiredPermissions: ["links.write"],
  },
);
