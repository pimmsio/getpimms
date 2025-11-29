import { isBlacklistedDomain, updateConfig } from "@/lib/edge-config";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { getPangeaDomainIntel } from "@/lib/pangea";
import { checkIfUserExists, getRandomKey } from "@/lib/planetscale";
import { checkUrlWithSafeBrowsing } from "@/lib/safeBrowsing";
import { isStored } from "@/lib/storage";
import { NewLinkProps, ProcessedLinkProps, WorkspaceProps } from "@/lib/types";
import { prisma } from "@dub/prisma";
import { sendEmail } from "@dub/email";
import { CheckFailureEmail } from "@dub/email/templates/check-failure";
import { MaliciousLinkAttemptEmail } from "@dub/email/templates/malicious-link-attempt";
import {
  DUB_DOMAINS,
  SHORT_DOMAIN,
  UTMTags,
  constructURLFromUTMParams,
  getApexDomain,
  getDomainWithoutWWW,
  getUrlFromString,
  isDubDomain,
  isValidUrl,
  log,
  parseDateTime,
  pluralize,
} from "@dub/utils";
import { combineTagIds } from "../tags/combine-tag-ids";
import { businessFeaturesCheck, proFeaturesCheck, starterFeaturesCheck } from "./plan-features-check";
import { keyChecks, processKey } from "./utils";

export async function processLink<T extends Record<string, any>>({
  payload,
  workspace,
  userId,
  bulk = false,
  skipKeyChecks = false, // only skip when key doesn't change (e.g. when editing a link)
  skipExternalIdChecks = false, // only skip when externalId doesn't change (e.g. when editing a link)
  skipFolderChecks = false, // only skip for update / upsert links
  skipProgramChecks = false, // only skip for when program is already validated
}: {
  payload: NewLinkProps & T;
  workspace?: Pick<WorkspaceProps, "id" | "plan">;
  userId?: string;
  bulk?: boolean;
  skipKeyChecks?: boolean;
  skipExternalIdChecks?: boolean;
  skipFolderChecks?: boolean;
  skipProgramChecks?: boolean;
}): Promise<
  | {
      link: NewLinkProps & T;
      error: string;
      code?: string;
      status?: number;
    }
  | {
      link: ProcessedLinkProps & T;
      error: null;
      code?: never;
      status?: never;
    }
> {
  let {
    domain,
    key,
    url,
    image,
    proxy,
    trackConversion,
    expiredUrl,
    tagNames,
    folderId,
    externalId,
    tenantId,
    partnerId,
    programId,
    webhookIds,
    testVariants,
  } = payload;

  let expiresAt: string | Date | null | undefined = payload.expiresAt;
  let testCompletedAt: string | Date | null | undefined =
    payload.testCompletedAt;

  let defaultProgramFolderId: string | null = null;
  const tagIds = combineTagIds(payload);

  // if URL is defined, perform URL checks
  if (url) {
    url = getUrlFromString(url);
    if (!isValidUrl(url)) {
      return {
        link: payload,
        error: "Invalid destination URL",
        code: "unprocessable_entity",
      };
    }
    if (UTMTags.some((tag) => payload[tag])) {
      const utmParams = UTMTags.reduce((acc, tag) => {
        if (payload[tag]) {
          acc[tag] = payload[tag];
        }
        return acc;
      }, {});
      url = constructURLFromUTMParams(url, utmParams);
    }
    // only root domain links can have empty desintation URL
  } else if (key !== "_root") {
    return {
      link: payload,
      error: "Missing destination URL",
      code: "bad_request",
    };
  }

  // free plan restrictions
  if (!workspace || workspace.plan === "free") {
    if (key === "_root" && url) {
      return {
        link: payload,
        error:
          "You can only set a redirect for a root domain link on a Starter plan and above. Upgrade to Starter to use this feature.",
        code: "forbidden",
      };
    }
    try {
      businessFeaturesCheck(payload);
      proFeaturesCheck(payload);
      starterFeaturesCheck(payload);
    } catch (error) {
      return {
        link: payload,
        error: error.message,
        code: "forbidden",
      };
    }
  } else if (workspace.plan === "starter") {
    try {
      businessFeaturesCheck(payload);
      proFeaturesCheck(payload);
    } catch (error) {
      return {
        link: payload,
        error: error.message,
        code: "forbidden",
      };
    }
  } else if (workspace.plan === "pro") {
    try {
      businessFeaturesCheck(payload);
    } catch (error) {
      return {
        link: payload,
        error: error.message,
        code: "forbidden",
      };
    }
  }

  if (!trackConversion && testVariants) {
    return {
      link: payload,
      error: "Lead tracking must be enabled to use A/B testing.",
      code: "unprocessable_entity",
    };
  }

  const domains = workspace
    ? await prisma.domain.findMany({
        where: { projectId: workspace.id },
      })
    : [];

  // if domain is not defined, set it to the workspace's primary domain
  if (!domain) {
    domain = domains?.find((d) => d.primary)?.slug || SHORT_DOMAIN;
  }

  const isMaliciousLink = await maliciousLinkCheck({
    url,
    userId,
    workspaceId: workspace?.id,
  });
  
  if (isMaliciousLink) {
    return {
      link: payload,
      error: "Malicious URL detected. An administrator has been notified.",
      code: "unprocessable_entity",
    };
  }

  // checks for pim.ms links
  if (domain === SHORT_DOMAIN) {
    // for dub.link: check if workspace plan is pro+
    // if (domain === "dub.link" && (!workspace || workspace.plan === "free")) {
    //   return {
    //     link: payload,
    //     error:
    //       "You can only use dub.link on a Pro plan and above. Upgrade to Pro to use this domain.",
    //     code: "forbidden",
    //   };
    // }

    // for dub.sh: check if user exists (if userId is passed)
    if (domain === SHORT_DOMAIN && userId) {
      const userExists = await checkIfUserExists(userId);
      if (!userExists) {
        return {
          link: payload,
          error: "Session expired. Please log in again.",
          code: "not_found",
        };
      }
    }
    // checks for other Dub-owned domains (chatg.pt, spti.fi, etc.)
  } else if (isDubDomain(domain)) {
    // coerce type with ! cause we already checked if it exists
    const { allowedHostnames } = DUB_DOMAINS.find((d) => d.slug === domain)! as any;
    const urlDomain = getDomainWithoutWWW(url) || "";
    const apexDomain = getApexDomain(url);
    if (
      key !== "_root" &&
      allowedHostnames &&
      !allowedHostnames.includes(urlDomain) &&
      !allowedHostnames.includes(apexDomain)
    ) {
      return {
        link: payload,
        error: `Invalid destination URL. You can only create ${domain} short links for URLs with the ${pluralize("domain", allowedHostnames.length)} ${allowedHostnames
          .map((d) => `"${d}"`)
          .join(", ")}.`,
        code: "unprocessable_entity",
      };
    }

    if (!skipKeyChecks && key?.includes("/")) {
      // check if the workspace has access to the parent link
      const parentKey = key.split("/")[0];
      const parentLink = await prisma.link.findUnique({
        where: { domain_key: { domain, key: parentKey } },
      });
      if (parentLink?.projectId !== workspace?.id) {
        return {
          link: payload,
          error: `You do not have access to create links in the ${domain}/${parentKey}/ subdirectory.`,
          code: "forbidden",
        };
      }
    }

    // else, check if the domain belongs to the workspace
  } else if (!domains?.find((d) => d.slug === domain)) {
    return {
      link: payload,
      error: "Domain does not belong to workspace.",
      code: "forbidden",
    };

    // else, check if the domain is a free .link and whether the workspace is pro+
  } else if (domain.endsWith(".link") && workspace?.plan === "free") {
    // Dub provisioned .link domains can only be used on a Pro plan and above
    const domainId = domains?.find((d) => d.slug === domain)?.id;
    const registeredDomain = await prisma.registeredDomain.findUnique({
      where: {
        domainId,
      },
    });
    if (registeredDomain) {
      return {
        link: payload,
        error:
          "You can only use your free .link domain on a Pro plan and above. Upgrade to Pro to use this domain.",
        code: "forbidden",
      };
    }
  }

  if (!key) {
    key = await getRandomKey({
      domain,
      prefix: payload["prefix"],
      long: domain === "loooooooo.ng",
    });
  } else if (!skipKeyChecks) {
    const processedKey = processKey({ domain, key });
    if (processedKey === null) {
      return {
        link: payload,
        error: "Invalid key.",
        code: "unprocessable_entity",
      };
    }
    key = processedKey;

    const response = await keyChecks({ domain, key, workspace });
    if (response.error && response.code) {
      return {
        link: payload,
        error: response.error,
        code: response.code,
      };
    }
  }

  if (externalId && workspace && !skipExternalIdChecks) {
    const link = await prisma.link.findUnique({
      where: {
        projectId_externalId: {
          projectId: workspace.id,
          externalId,
        },
      },
    });

    if (link) {
      return {
        link: payload,
        error: "A link with this externalId already exists in this workspace.",
        code: "conflict",
      };
    }
  }

  if (bulk) {
    if (proxy && image && !isStored(image)) {
      return {
        link: payload,
        error: "You cannot set custom social cards with bulk link creation.",
        code: "unprocessable_entity",
      };
    }
  } else {
    // only perform tag validity checks if:
    // - not bulk creation (we do that check separately in the route itself)
    // - tagIds are present
    if (tagIds && tagIds.length > 0) {
      if (!workspace) {
        return {
          link: payload,
          error:
            "Workspace not found. You can't add tags to a link without a workspace.",
          code: "not_found",
        };
      }
      const tags = await prisma.tag.findMany({
        select: {
          id: true,
        },
        where: { projectId: workspace.id, id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        return {
          link: payload,
          error:
            "Invalid tagIds detected: " +
            tagIds
              .filter(
                (tagId) => tags.find(({ id }) => tagId === id) === undefined,
              )
              .join(", "),
          code: "unprocessable_entity",
        };
      }
    } else if (tagNames && tagNames.length > 0) {
      if (!workspace) {
        return {
          link: payload,
          error:
            "Workspace not found. You can't add tags to a link without a workspace.",
          code: "not_found",
        };
      }

      const tags = await prisma.tag.findMany({
        select: {
          name: true,
        },
        where: {
          projectId: workspace.id,
          name: { in: tagNames },
        },
      });

      if (tags.length !== tagNames.length) {
        return {
          link: payload,
          error:
            "Invalid tagNames detected: " +
            tagNames
              .filter(
                (tagName) =>
                  tags.find(({ name }) => tagName === name) === undefined,
              )
              .join(", "),
          code: "unprocessable_entity",
        };
      }
    }

    // only perform folder validity checks if:
    // - not bulk creation (we do that check separately in the route itself)
    // - folderId is present and we're not skipping folder checks
    if (folderId && !skipFolderChecks) {
      if (!workspace || !userId) {
        return {
          link: payload,
          error:
            "Workspace or user ID not found. You can't add a folder to a link without a workspace or user ID.",
          code: "not_found",
        };
      }

      if (workspace.plan === "free") {
        return {
          link: payload,
          error: "You can't add a folder to a link on a free plan.",
          code: "forbidden",
        };
      }

      try {
        await verifyFolderAccess({
          workspace,
          userId,
          folderId,
          requiredPermission: "folders.links.write",
        });
      } catch (error) {
        return {
          link: payload,
          error: error.message,
          code: error.code,
        };
      }
    }

    // Program validity checks
    if (programId && !skipProgramChecks) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: {
          workspaceId: true,
          defaultFolderId: true,
          ...(!partnerId && tenantId
            ? {
                partners: {
                  where: {
                    tenantId,
                  },
                },
              }
            : {}),
        },
      });

      if (!program || program.workspaceId !== workspace?.id) {
        return {
          link: payload,
          error: "Program not found.",
          code: "not_found",
        };
      }

      if (!partnerId) {
        partnerId =
          program?.partners?.length > 0 ? program.partners[0].partnerId : null;
      }

      defaultProgramFolderId = program.defaultFolderId;
    }

    // Webhook validity checks
    if (webhookIds && webhookIds.length > 0) {
      if (!workspace || workspace.plan === "free" || workspace.plan === "starter") {
        return {
          link: payload,
          error:
            "You can only use webhooks on a Pro plan and above. Upgrade to Pro to use this feature.",
          code: "forbidden",
        };
      }

      webhookIds = [...new Set(webhookIds)];

      const webhooks = await prisma.webhook.findMany({
        select: {
          id: true,
        },
        where: { projectId: workspace?.id, id: { in: webhookIds } },
      });

      if (webhooks.length !== webhookIds.length) {
        const invalidWebhookIds = webhookIds.filter(
          (webhookId) =>
            webhooks.find(({ id }) => webhookId === id) === undefined,
        );

        return {
          link: payload,
          error: "Invalid webhookIds detected: " + invalidWebhookIds.join(", "),
          code: "unprocessable_entity",
        };
      }
    }
  }

  // custom social media image checks (see if R2 is configured)
  if (proxy && !process.env.STORAGE_SECRET_ACCESS_KEY) {
    return {
      link: payload,
      error: "Missing storage access key.",
      code: "bad_request",
    };
  }

  // expire date checks
  if (expiresAt) {
    const datetime = parseDateTime(expiresAt);

    if (!datetime) {
      return {
        link: payload,
        error: "Invalid expiration date.",
        code: "unprocessable_entity",
      };
    }

    expiresAt = datetime;

    if (expiredUrl) {
      expiredUrl = getUrlFromString(expiredUrl);

      if (!isValidUrl(expiredUrl)) {
        return {
          link: payload,
          error: "Invalid expired URL.",
          code: "unprocessable_entity",
        };
      }
    }
  }

  if (testCompletedAt) {
    const datetime = parseDateTime(testCompletedAt);

    if (!datetime) {
      return {
        link: payload,
        error: "Invalid test completion date.",
        code: "unprocessable_entity",
      };
    }

    testCompletedAt = datetime;
  }

  // remove polyfill attributes from payload
  delete payload["shortLink"];
  delete payload["qrCode"];
  delete payload["prefix"];
  UTMTags.forEach((tag) => {
    delete payload[tag];
  });

  return {
    link: {
      ...payload,
      domain,
      key,
      // we're redefining these fields because they're processed in the function
      url,
      expiresAt,
      expiredUrl,
      testVariants,
      testCompletedAt,
      // partnerId derived from payload or program enrollment
      partnerId: partnerId || null,
      // make sure projectId is set to the current workspace
      projectId: workspace?.id || null,
      // if userId is passed, set it (we don't change the userId if it's already set, e.g. when editing a link)
      ...(userId && {
        userId,
      }),
      ...(webhookIds && {
        webhookIds,
      }),
      folderId: folderId || defaultProgramFolderId,
    },
    error: null,
  };
}

async function maliciousLinkCheck({
  url,
  userId,
  workspaceId,
}: {
  url: string;
  userId?: string;
  workspaceId?: string;
}): Promise<boolean> {
  // Helper to get user/workspace info and send email when malicious link detected
  const handleMaliciousLink = async (domain: string, reason: string) => {
    const { userEmail, userName, workspaceName, workspaceSlug } =
      await getUserAndWorkspaceInfo(userId, workspaceId);
    
    await sendMaliciousLinkEmail({
      url,
      domain,
      userEmail,
      userName,
      workspaceName,
      workspaceSlug,
      reason,
    });
  };

  const [domain, apexDomain] = [getDomainWithoutWWW(url), getApexDomain(url)];

  if (!domain) {
    return false;
  }

  // Check blacklist first - if detected, skip all other checks
  const domainBlacklisted = await isBlacklistedDomain(domain);
  if (domainBlacklisted === true) {
    await handleMaliciousLink(domain, "blacklisted domain");
    return true;
  } else if (domainBlacklisted === "whitelisted") {
    return false;
  }

  // Safe Browsing check (first, before Pangea)
  if (process.env.SAFE_BROWSING_API_KEY) {
    try {
      const result = await checkUrlWithSafeBrowsing(url);
      if (!result.safe) {
        await Promise.all([
          updateConfig({
            key: "domains",
            value: domain,
          }),
          log({
            message: `Malicious link detected via Safe Browsing → ${url}`,
            type: "links",
            mention: true,
          }),
          handleMaliciousLink(
            domain,
            `Safe Browsing check failed`,
          ),
        ]);
        
        return true;
      }
    } catch (e) {
      console.error("Error checking URL with Safe Browsing", e);
      await sendCheckFailureEmail({
        url,
        domain,
        service: "Google Safe Browsing",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Pangea check (only if Safe Browsing didn't detect anything)
  if (process.env.PANGEA_API_KEY) {
    try {
      const response = await getPangeaDomainIntel(domain);
      console.log("Pangea response:", response);
      const verdict = response.result.data[apexDomain].verdict;

      if (verdict === "malicious" || verdict === "suspicious") {
        await Promise.all([
          updateConfig({
            key: "domains",
            value: domain,
          }),
          log({
            message: `Suspicious link detected via Pangea → ${url}`,
            type: "links",
            mention: true,
          }),
          handleMaliciousLink(domain, `Pangea: ${verdict}`),
        ]);

        return true;
      }

    } catch (e) {
      console.error("Error checking domain with Pangea", e);
      await sendCheckFailureEmail({
        url,
        domain,
        service: "Pangea",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return false;
}

async function getUserAndWorkspaceInfo(
  userId?: string,
  workspaceId?: string,
): Promise<{
  userEmail?: string;
  userName?: string;
  workspaceName?: string;
  workspaceSlug?: string;
}> {
  const [userInfo, workspaceInfo] = await Promise.all([
    userId
      ? prisma.user
          .findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          })
          .then((user) => ({
            email: user?.email ?? undefined,
            name: user?.name ?? undefined,
          }))
          .catch((e) => {
            console.error("Error fetching user info for malicious link email", e);
            return { email: undefined, name: undefined };
          })
      : { email: undefined, name: undefined },
    workspaceId
      ? prisma.project
          .findUnique({
            where: { id: workspaceId },
            select: { name: true, slug: true },
          })
          .then((workspace) => ({
            name: workspace?.name ?? undefined,
            slug: workspace?.slug ?? undefined,
          }))
          .catch((e) => {
            console.error(
              "Error fetching workspace info for malicious link email",
              e,
            );
            return { name: undefined, slug: undefined };
          })
      : { name: undefined, slug: undefined },
  ]);

  return {
    userEmail: userInfo.email,
    userName: userInfo.name,
    workspaceName: workspaceInfo.name,
    workspaceSlug: workspaceInfo.slug,
  };
}

async function sendMaliciousLinkEmail({
  url,
  domain,
  userEmail,
  userName,
  workspaceName,
  workspaceSlug,
  reason,
}: {
  url: string;
  domain: string;
  userEmail?: string;
  userName?: string;
  workspaceName?: string;
  workspaceSlug?: string;
  reason: string;
}) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "alexandre@pimms.io";
    
    await sendEmail({
      email: adminEmail,
      subject: `⚠️ Malicious Link Attempt: ${domain}`,
      react: MaliciousLinkAttemptEmail({
        url,
        domain,
        userEmail,
        userName,
        workspaceName,
        workspaceSlug,
        reason,
      }),
      variant: "notifications",
    });
  } catch (e) {
    console.error("Error sending malicious link attempt email", e);
  }
}

async function sendCheckFailureEmail({
  url,
  domain,
  service,
  error,
}: {
  url: string;
  domain: string;
  service: string;
  error: string;
}) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "alexandre@pimms.io";
    
    await sendEmail({
      email: adminEmail,
      subject: `⚠️ ${service} Check Failed: ${domain}`,
      react: CheckFailureEmail({
        url,
        domain,
        service,
        error,
      }),
      variant: "notifications",
    });
  } catch (e) {
    console.error("Error sending check failure email", e);
  }
}
