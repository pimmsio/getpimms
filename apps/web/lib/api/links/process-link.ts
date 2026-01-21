import {
  isBlacklistedDomain,
  isWhitelistedDomain,
  updateConfig,
} from "@/lib/edge-config";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { getPangeaDomainIntel } from "@/lib/pangea";
import { checkIfUserExists, getRandomKey } from "@/lib/planetscale";
import { checkUrlWithSafeBrowsing } from "@/lib/safeBrowsing";
import { isStored } from "@/lib/storage";
import { NewLinkProps, ProcessedLinkProps, WorkspaceProps } from "@/lib/types";
import { sendEmail } from "@dub/email";
import { CheckFailureEmail } from "@dub/email/templates/check-failure";
import { FreePlanRedirectAttemptEmail } from "@dub/email/templates/free-plan-redirect-attempt";
import { MaliciousLinkAttemptEmail } from "@dub/email/templates/malicious-link-attempt";
import { TooManyRedirectsEmail } from "@dub/email/templates/too-many-redirects";
import { prisma } from "@dub/prisma";
import {
  constructURLFromUTMParams,
  DUB_DOMAINS,
  getApexDomain,
  getDomainWithoutWWW,
  getParamsFromURL,
  getUrlFromString,
  isDubDomain,
  isValidUrl,
  log,
  normalizeUtmValue,
  parseDateTime,
  pluralize,
  SHORT_DOMAIN,
  UTMTags,
} from "@dub/utils";
import { combineTagIds } from "../tags/combine-tag-ids";
import { followRedirectChain, MAX_HOPS } from "./follow-redirects";
import {
  businessFeaturesCheck,
  proFeaturesCheck,
  proLinkFeaturesCheck,
} from "./plan-features-check";
import { keyChecks, processKey } from "./utils";

/**
 * Check if a URL's domain is in the whitelist of allowed short link services
 * Uses the whitelistedDomains from Vercel Edge Config
 */
async function isDomainWhitelisted(url: string): Promise<boolean> {
  try {
    const domain = getDomainWithoutWWW(url);
    if (!domain) return false;

    // Check both the full domain and apex domain against the whitelist
    const apexDomain = getApexDomain(url);

    const [isDomainWhitelisted, isApexWhitelisted] = await Promise.all([
      isWhitelistedDomain(domain),
      apexDomain ? isWhitelistedDomain(apexDomain) : Promise.resolve(false),
    ]);

    return isDomainWhitelisted || isApexWhitelisted;
  } catch (error) {
    console.error("Error checking whitelisted domain:", error);
    return false;
  }
}

export async function processLink<T extends Record<string, any>>({
  payload,
  workspace,
  userId,
  bulk = false,
  skipKeyChecks = false, // only skip when key doesn't change (e.g. when editing a link)
  skipExternalIdChecks = false, // only skip when externalId doesn't change (e.g. when editing a link)
  skipFolderChecks = false, // only skip for update / upsert links
}: {
  payload: NewLinkProps & T;
  workspace?: Pick<WorkspaceProps, "id" | "plan">;
  userId?: string;
  bulk?: boolean;
  skipKeyChecks?: boolean;
  skipExternalIdChecks?: boolean;
  skipFolderChecks?: boolean;
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
  let { domain, key, url, expiredUrl, webhookIds } = payload;
  const { image, proxy, tagNames, folderId, externalId, testVariants } =
    payload;

  // Conversion tracking is enabled by default for all accounts.
  // We keep this pinned on so the product doesn’t branch into “tracking on/off” mental models.
  const trackConversion = true;

  let expiresAt: string | Date | null | undefined = payload.expiresAt;
  let testCompletedAt: string | Date | null | undefined =
    payload.testCompletedAt;

  const tagIds = combineTagIds(payload);

  // Store original URL before processing to check if it had UTMs
  const originalUrl = payload.url;

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
      // Check if original URL had UTMs that match the form fields
      // If so, preserve the original URL to maintain exact character formatting
      const originalUrlNormalized = originalUrl
        ? getUrlFromString(originalUrl)
        : null;
      const originalUrlUtms = originalUrlNormalized
        ? getParamsFromURL(originalUrlNormalized)
        : {};
      const originalUrlUtmKeys = UTMTags.filter((tag) => originalUrlUtms[tag]);

      // Check if form field UTMs match original URL UTMs (after normalization)
      const utmsMatchOriginal =
        originalUrlUtmKeys.length > 0 &&
        originalUrlUtmKeys.every((tag) => {
          const originalValue = originalUrlUtms[tag];
          const formValue = payload[tag];
          // Compare normalized values to see if they match
          return (
            originalValue &&
            formValue &&
            normalizeUtmValue(originalValue) === normalizeUtmValue(formValue)
          );
        });

      if (utmsMatchOriginal && originalUrlNormalized) {
        // Preserve original URL with exact UTM formatting
        url = originalUrlNormalized;
      } else {
        // Form fields were manually set or don't match original - use constructURLFromUTMParams
        const utmParams = UTMTags.reduce((acc, tag) => {
          if (payload[tag]) {
            acc[tag] = payload[tag];
          }
          return acc;
        }, {});
        url = constructURLFromUTMParams(url, utmParams);
      }
    }
    // only root domain links can have empty desintation URL
  } else if (key !== "_root") {
    return {
      link: payload,
      error: "Missing destination URL",
      code: "bad_request",
    };
  }

  const normalizedPlan = workspace?.plan || "free";

  // free plan restrictions
  if (!workspace || normalizedPlan === "free") {
    if (key === "_root" && url) {
      return {
        link: payload,
        error:
          "You can only set a redirect for a root domain link on a Pro plan and above. Upgrade to Pro to use this feature.",
        code: "forbidden",
      };
    }
    try {
      businessFeaturesCheck(payload);
      proFeaturesCheck(payload);
      proLinkFeaturesCheck(payload);
    } catch (error) {
      return {
        link: payload,
        error: error.message,
        code: "forbidden",
      };
    }
  } else if (normalizedPlan === "pro") {
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
        where: {
          OR: [
            { projectId: workspace.id },
            {
              workspaceAccesses: {
                some: {
                  workspaceId: workspace.id,
                  enabled: true,
                },
              },
            },
          ],
        },
      })
    : [];

  // if domain is not defined, set it to the workspace's primary domain
  if (!domain) {
    domain = domains?.find((d) => d.primary)?.slug || SHORT_DOMAIN;
  }

  // Check redirect restrictions and security
  const redirectCheck = await checkRedirectRestrictions({
    url,
    workspacePlan: workspace?.plan || "free",
    userId,
    workspaceId: workspace?.id,
  });

  if (redirectCheck.error) {
    return {
      link: payload,
      error: redirectCheck.error,
      code: redirectCheck.code,
    };
  }

  const maliciousCheck = await checkUrlSecurity({
    urlsToCheck: redirectCheck.urlsToCheck!,
    originalUrl: url,
    userId,
    workspaceId: workspace?.id,
  });

  if (maliciousCheck.isMalicious) {
    return {
      link: payload,
      error:
        maliciousCheck.reason ||
        "Malicious URL detected. An administrator has been notified.",
      code: maliciousCheck.code || "unprocessable_entity",
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
    const { allowedHostnames } = DUB_DOMAINS.find(
      (d) => d.slug === domain,
    )! as any;
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
      error: "Domain is not enabled for this workspace.",
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

    // Webhook validity checks
    if (webhookIds && webhookIds.length > 0) {
      if (!workspace || workspace.plan === "free") {
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
  // partner/program/referral features removed; prevent setting these fields on newly created/updated links
  delete payload["tenantId"];
  delete payload["partnerId"];
  delete payload["programId"];
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
      // make sure projectId is set to the current workspace
      projectId: workspace?.id || null,
      // if userId is passed, set it (we don't change the userId if it's already set, e.g. when editing a link)
      ...(userId && {
        userId,
      }),
      ...(webhookIds && {
        webhookIds,
      }),
      folderId,
    },
    error: null,
  };
}

/**
 * Check redirect restrictions including count limits and plan restrictions
 */
async function checkRedirectRestrictions({
  url,
  workspacePlan,
  userId,
  workspaceId,
}: {
  url: string;
  workspacePlan: WorkspaceProps["plan"];
  userId?: string;
  workspaceId?: string;
}): Promise<
  | { error: null; urlsToCheck: string[]; code?: never }
  | { error: string; code: string; urlsToCheck?: never }
> {
  // Follow redirect chain (detect multi-apex-domain chains)
  // Fail-closed for free plan (if we can't validate, we reject).
  const redirectResult = await followRedirectChain(url, {
    maxHops: MAX_HOPS,
    failClosed: workspacePlan === "free",
  });

  // Check if the original URL is from a whitelisted domain (e.g., wa.me, youtu.be, bit.ly)
  // If it is, allow multiple redirects regardless of plan or redirect count
  const isOriginalUrlWhitelisted = await isDomainWhitelisted(url);

  // Handle redirect following errors
  // IMPORTANT: Check whitelist BEFORE rejecting for too many redirects
  // Whitelisted domains should be allowed regardless of redirect count
  if (!redirectResult.success) {
    console.error("Error following redirect chain:", redirectResult.error);

    // If too many redirects, check whitelist first before rejecting
    if (redirectResult.tooManyRedirects) {
      // If the domain is whitelisted, allow it despite too many redirects
      if (isOriginalUrlWhitelisted) {
        // Continue processing - don't reject whitelisted domains
      } else {
        // Not whitelisted - reject for too many redirects
        await sendTooManyRedirectsEmail({
          url,
          hopsFollowed: redirectResult.hopsFollowed,
          redirectChain: redirectResult.urls,
          apexDomains: redirectResult.apexDomains,
          userId,
          workspaceId,
        });

        await log({
          message: `Link rejected due to too many redirects → ${url} (${redirectResult.hopsFollowed} hops, max ${MAX_HOPS}). Chain: ${redirectResult.urls.join(" → ")}`,
          type: "links",
          mention: true,
        });

        return {
          error: `Invalid destination URL: This link has too many redirects (maximum ${MAX_HOPS} hops allowed).`,
          code: "unprocessable_entity",
        };
      }
    }

    // Fail-closed for free plan: if we can't validate redirects, reject unless whitelisted.
    if (workspacePlan === "free" && !isOriginalUrlWhitelisted) {
      await Promise.all([
        sendFreePlanRedirectAttemptEmail({
          url,
          hopsFollowed: redirectResult.hopsFollowed,
          redirectChain: redirectResult.urls,
          apexDomains: redirectResult.apexDomains,
          userId,
          workspaceId,
        }),
        log({
          message: `Free user attempted to create link but redirect validation failed (fail-closed) → ${url}. Error: ${redirectResult.error || "unknown"}. Chain: ${redirectResult.urls.join(" → ")}`,
          type: "links",
          mention: false,
        }),
      ]);

      return {
        error:
          "Invalid destination URL: We couldn't validate this URL's redirects on the free plan. Please try a different URL or upgrade for advanced redirect support.",
        code: "unprocessable_entity",
      };
    }
  }

  // Free users cannot create links that redirect across apex domains, UNLESS the original URL is whitelisted
  if (
    workspacePlan === "free" &&
    redirectResult.success &&
    redirectResult.hasMultipleApexDomains &&
    !isOriginalUrlWhitelisted
  ) {
    await Promise.all([
      sendFreePlanRedirectAttemptEmail({
        url,
        hopsFollowed: redirectResult.hopsFollowed,
        redirectChain: redirectResult.urls,
        apexDomains: redirectResult.apexDomains,
        userId,
        workspaceId,
      }),
      log({
        message: `Free user attempted to create link with multi-domain redirect chain → ${url}. Domains: ${redirectResult.apexDomains.join(", ")}. Chain: ${redirectResult.urls.join(" → ")}`,
        type: "links",
        mention: false,
      }),
    ]);

    return {
      error:
        "Invalid destination URL: Redirect chains across multiple domains are not allowed on the free plan. However, well-known services like wa.me, youtu.be, etc. are allowed.",
      code: "unprocessable_entity",
    };
  }

  // Get all URLs in the chain to check (use original URL if redirect following failed)
  const urlsToCheck = redirectResult.success ? redirectResult.urls : [url];

  return { error: null, urlsToCheck };
}

/**
 * Check URL security by scanning for malicious content
 */
async function checkUrlSecurity({
  urlsToCheck,
  originalUrl,
  userId,
  workspaceId,
}: {
  urlsToCheck: string[];
  originalUrl: string;
  userId?: string;
  workspaceId?: string;
}): Promise<{ isMalicious: boolean; reason?: string; code?: string }> {
  console.log(
    `Checking ${urlsToCheck.length} URL(s) in redirect chain:`,
    urlsToCheck,
  );

  // Check each URL in the chain
  for (let i = 0; i < urlsToCheck.length; i++) {
    const currentUrl = urlsToCheck[i];
    const isRedirect = i > 0;
    const [domain, apexDomain] = [
      getDomainWithoutWWW(currentUrl),
      getApexDomain(currentUrl),
    ];

    if (!domain) {
      continue;
    }

    // Check blacklist
    const blacklistResult = await checkBlacklist(domain);
    if (blacklistResult.isBlacklisted) {
      await handleMaliciousDetection({
        url: currentUrl,
        domain,
        reason: "blacklisted domain",
        isRedirect,
        originalUrl,
        urlsToCheck,
        userId,
        workspaceId,
      });
      return {
        isMalicious: true,
        reason:
          "Invalid destination URL: Flagged as malicious. An administrator has been notified.",
        code: "unprocessable_entity",
      };
    } else if (blacklistResult.isWhitelisted) {
      console.log(
        `URL ${currentUrl} is whitelisted, skipping remaining checks`,
      );
      return { isMalicious: false };
    }

    // Check Safe Browsing
    if (process.env.SAFE_BROWSING_API_KEY) {
      const safeBrowsingResult = await checkSafeBrowsing(currentUrl, domain);
      if (safeBrowsingResult.isMalicious) {
        await handleMaliciousDetection({
          url: currentUrl,
          domain,
          reason: "Safe Browsing check failed",
          isRedirect,
          originalUrl,
          urlsToCheck,
          userId,
          workspaceId,
        });
        return {
          isMalicious: true,
          reason:
            "Invalid destination URL: Flagged as malicious. An administrator has been notified.",
          code: "unprocessable_entity",
        };
      }
    }

    // Check Pangea
    if (process.env.PANGEA_API_KEY) {
      const pangeaResult = await checkPangeaSecurity(domain, apexDomain);
      if (pangeaResult.isMalicious) {
        await handleMaliciousDetection({
          url: currentUrl,
          domain,
          reason: `Pangea: ${pangeaResult.verdict}`,
          isRedirect,
          originalUrl,
          urlsToCheck,
          userId,
          workspaceId,
        });
        return {
          isMalicious: true,
          reason: `Invalid destination URL: Flagged as malicious. An administrator has been notified.`,
          code: "unprocessable_entity",
        };
      }
    }
  }

  return { isMalicious: false };
}

/**
 * Check if domain is blacklisted or whitelisted
 */
async function checkBlacklist(domain: string): Promise<{
  isBlacklisted: boolean;
  isWhitelisted: boolean;
}> {
  const result = await isBlacklistedDomain(domain);
  return {
    isBlacklisted: result === true,
    isWhitelisted: result === "whitelisted",
  };
}

/**
 * Check URL with Google Safe Browsing
 */
async function checkSafeBrowsing(
  url: string,
  domain: string,
): Promise<{ isMalicious: boolean }> {
  try {
    const result = await checkUrlWithSafeBrowsing(url);
    return { isMalicious: !result.safe };
  } catch (e) {
    console.error("Error checking URL with Safe Browsing", e);
    await sendCheckFailureEmail({
      url,
      domain,
      service: "Google Safe Browsing",
      error: e instanceof Error ? e.message : String(e),
    });
    return { isMalicious: false };
  }
}

/**
 * Check domain with Pangea security
 */
async function checkPangeaSecurity(
  domain: string,
  apexDomain: string,
): Promise<{ isMalicious: boolean; verdict?: string }> {
  try {
    const response = await getPangeaDomainIntel(domain);
    console.log("Pangea response:", response);
    const verdict = response.result.data[apexDomain].verdict;

    if (verdict === "malicious" || verdict === "suspicious") {
      return { isMalicious: true, verdict };
    }

    return { isMalicious: false };
  } catch (e) {
    console.error("Error checking domain with Pangea", e);
    await sendCheckFailureEmail({
      url: domain,
      domain,
      service: "Pangea",
      error: e instanceof Error ? e.message : String(e),
    });
    return { isMalicious: false };
  }
}

/**
 * Handle malicious link detection - send notifications and update configs
 */
async function handleMaliciousDetection({
  url,
  domain,
  reason,
  isRedirect,
  originalUrl,
  urlsToCheck,
  userId,
  workspaceId,
}: {
  url: string;
  domain: string;
  reason: string;
  isRedirect: boolean;
  originalUrl: string;
  urlsToCheck: string[];
  userId?: string;
  workspaceId?: string;
}) {
  const redirectInfo = isRedirect
    ? ` (detected in redirect chain from ${originalUrl}: ${urlsToCheck.join(" → ")})`
    : "";

  const { userEmail, userName, workspaceName, workspaceSlug } =
    await getUserAndWorkspaceInfo(userId, workspaceId);

  await Promise.all([
    updateConfig({
      key: "domains",
      value: domain,
    }),
    log({
      message: `Malicious link detected → ${url}${isRedirect ? ` (via redirect from ${originalUrl})` : ""}`,
      type: "links",
      mention: true,
    }),
    sendMaliciousLinkEmail({
      url,
      domain,
      userEmail,
      userName,
      workspaceName,
      workspaceSlug,
      reason: reason + redirectInfo,
    }),
  ]);
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
            console.error(
              "Error fetching user info for malicious link email",
              e,
            );
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

async function sendTooManyRedirectsEmail({
  url,
  hopsFollowed,
  redirectChain,
  apexDomains,
  userId,
  workspaceId,
}: {
  url: string;
  hopsFollowed: number;
  redirectChain: string[];
  apexDomains: string[];
  userId?: string;
  workspaceId?: string;
}) {
  try {
    const { userEmail, userName, workspaceName, workspaceSlug } =
      await getUserAndWorkspaceInfo(userId, workspaceId);

    const adminEmail = process.env.ADMIN_EMAIL || "alexandre@pimms.io";

    await sendEmail({
      email: adminEmail,
      subject: `⚠️ Too Many Redirects Detected: ${getDomainWithoutWWW(url) || url}`,
      react: TooManyRedirectsEmail({
        url,
        hopsFollowed,
        redirectChain,
        apexDomains,
        userEmail,
        userName,
        workspaceName,
        workspaceSlug,
      }),
      variant: "notifications",
    });
  } catch (e) {
    console.error("Error sending too many redirects email", e);
  }
}

async function sendFreePlanRedirectAttemptEmail({
  url,
  hopsFollowed,
  redirectChain,
  apexDomains,
  userId,
  workspaceId,
}: {
  url: string;
  hopsFollowed: number;
  redirectChain: string[];
  apexDomains: string[];
  userId?: string;
  workspaceId?: string;
}) {
  try {
    const { userEmail, userName, workspaceName, workspaceSlug } =
      await getUserAndWorkspaceInfo(userId, workspaceId);

    const adminEmail = process.env.ADMIN_EMAIL || "alexandre@pimms.io";

    await sendEmail({
      email: adminEmail,
      subject: `💎 Free Plan Redirect Attempt: ${getDomainWithoutWWW(url) || url}`,
      react: FreePlanRedirectAttemptEmail({
        url,
        hopsFollowed,
        redirectChain,
        apexDomains,
        userEmail,
        userName,
        workspaceName,
        workspaceSlug,
      }),
      variant: "notifications",
    });
  } catch (e) {
    console.error("Error sending free plan redirect attempt email", e);
  }
}
