import { DubApiError } from "@/lib/api/errors";
import { prisma } from "@dub/prisma";
import { getCurrentPlan, INFINITY_NUMBER } from "@dub/utils";

export function getUtmLimitsForPlan(plan: string | null | undefined) {
  const currentPlan = getCurrentPlan(plan ?? "free");
  const templateLimit = currentPlan.limits.utmTemplates ?? INFINITY_NUMBER;
  const parameterLimit = currentPlan.limits.utmParameters ?? INFINITY_NUMBER;

  return {
    planName: currentPlan.name,
    templateLimit,
    parameterLimit,
  };
}

export async function getUtmParameterLibraryCount(projectId: string) {
  const [sources, mediums, campaigns, terms, contents] = await prisma.$transaction([
    prisma.utmSource.count({ where: { projectId } }),
    prisma.utmMedium.count({ where: { projectId } }),
    prisma.utmCampaign.count({ where: { projectId } }),
    prisma.utmTerm.count({ where: { projectId } }),
    prisma.utmContent.count({ where: { projectId } }),
  ]);

  return sources + mediums + campaigns + terms + contents;
}

export function throwIfUtmTemplatesLimitExceeded({
  plan,
  currentCount,
}: {
  plan: string | null | undefined;
  currentCount: number;
}) {
  const { planName, templateLimit } = getUtmLimitsForPlan(plan);
  if (templateLimit >= INFINITY_NUMBER) return;
  if (currentCount < templateLimit) return;

  throw new DubApiError({
    code: "exceeded_limit",
    message: `You've reached your UTM templates limit of ${templateLimit} on the ${planName} plan. Please upgrade to create more UTM templates.`,
  });
}

export async function throwIfUtmParametersLimitExceeded({
  plan,
  projectId,
  currentCount,
}: {
  plan: string | null | undefined;
  projectId: string;
  // Pass currentCount if you already computed it; otherwise we'll compute it.
  currentCount?: number;
}) {
  const { planName, parameterLimit } = getUtmLimitsForPlan(plan);
  if (parameterLimit >= INFINITY_NUMBER) return;

  const total = currentCount ?? (await getUtmParameterLibraryCount(projectId));
  if (total < parameterLimit) return;

  throw new DubApiError({
    code: "exceeded_limit",
    message: `You've reached your UTM parameters limit of ${parameterLimit} on the ${planName} plan. Please upgrade to save more UTM parameters.`,
  });
}


