import { NextRequest, NextResponse } from "next/server";

function parseBoolParam(value: string | null) {
  if (!value) return false;
  return value === "1" || value === "true" || value === "yes";
}

function scanHtml(html: string) {
  const detectionScript = "cdn.pimms.io/analytics/script.detection.js";
  const exposeScript = "cdn.pimms.io/analytics/script.expose.js";
  const injectFormScript = "cdn.pimms.io/analytics/script.inject-form.js";

  const scriptRegex =
    /<script[^>]*(?:src=["']([^"']*)["'][^>]*)?[^>]*>(.*?)<\/script>/gi;
  const matches = html.match(scriptRegex) || [];

  let scriptFound = false;
  let exposeFound = false;
  let injectFormFound = false;

  for (const m of matches) {
    const srcMatch = m.match(/src=["']([^"']*)["']/);
    const src = srcMatch ? srcMatch[1] : "";
    if (src.includes(detectionScript)) scriptFound = true;
    if (src.includes(exposeScript)) exposeFound = true;
    if (src.includes(injectFormScript)) injectFormFound = true;

    // inline bundle / snippet case
    if (m.includes("@getpimms/analytics")) scriptFound = true;
  }

  // Also accept the SDK meta tag as “detected”.
  const metaFound =
    /<meta\s+name=["']pimms-sdk["']\s+content=["']true["']\s*\/?>/i.test(html);
  if (metaFound) scriptFound = true;

  return { scriptFound, exposeFound, injectFormFound };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const requireInjectForm = parseBoolParam(searchParams.get("requireInjectForm"));
  const requireExpose = parseBoolParam(searchParams.get("requireExpose"));

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const parsedUrl = new URL(normalizedUrl);

    const response = await fetch(parsedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Pimms-Script-Checker/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({
        detected: false,
        error: `Failed to fetch webpage: ${response.status} ${response.statusText}. Please check that the URL is accessible.`,
      });
    }

    const html = await response.text();
    let { scriptFound, exposeFound, injectFormFound } = scanHtml(html);

    // Fallback: render JS if we didn't meet the requirements.
    const needsMore =
      !scriptFound ||
      (requireInjectForm && !injectFormFound) ||
      (requireExpose && !exposeFound);

    if (needsMore) {
      const wsApiKey = process.env.WEBSCRAPINGAI_API_KEY;
      if (!wsApiKey) throw new Error("WEBSCRAPINGAI_API_KEY not set");

      const wsUrl = `https://api.webscraping.ai/html?api_key=${wsApiKey}&url=${encodeURIComponent(
        parsedUrl.toString(),
      )}&render_js=true&wait=5`;

      const wsResponse = await fetch(wsUrl, {
        headers: { Accept: "text/html", "User-Agent": "Pimms Checker" },
      });

      if (!wsResponse.ok) {
        const errorText = await wsResponse.text().catch(() => "");
        console.warn("Webscraping.ai failed:", errorText);
        throw new Error(`Webscraping.ai fetch failed (${wsResponse.status})`);
      }

      const renderedHtml = await wsResponse.text();
      ({ scriptFound, exposeFound, injectFormFound } = scanHtml(renderedHtml));
    }

    const detected =
      scriptFound &&
      (!requireInjectForm || injectFormFound) &&
      (!requireExpose || exposeFound);

    return NextResponse.json({ detected, error: null });
  } catch (error) {
    console.error("Error checking script:", error);
    let errorMessage = "Unknown error occurred";
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      errorMessage = "Invalid URL format. Please ensure the URL is correct.";
    } else if (error instanceof DOMException && error.name === "TimeoutError") {
      errorMessage = "Request timeout. The website took too long to respond.";
    } else if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error. Unable to reach the website.";
    }
    return NextResponse.json({ detected: false, error: errorMessage });
  }
}

