const GOOGLE_SAFE_BROWSING_URL =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";

type ThreatMatch = {
  threatType: string;
  platformType: string;
  threat: {
    url: string;
  };
};

export async function checkUrlWithSafeBrowsing(
  url: string,
): Promise<{ safe: boolean; matches?: ThreatMatch[] }> {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    throw new Error("SAFE_BROWSING_API_KEY is not set");
  }

  const body = {
    client: {
      clientId: "pimms.io",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const res = await fetch(
    `${GOOGLE_SAFE_BROWSING_URL}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Safe Browsing error:", res.status, text);
    throw new Error("Safe Browsing API error");
  }

  const data = (await res.json()) as { matches?: ThreatMatch[] };

  if (data && data.matches && data.matches.length > 0) {
    console.log("Warning: Safe Browsing API returned matches:", data.matches);

    return { safe: false, matches: data.matches };
  }

  console.log("OK: Safe Browsing API returned safe:", true);

  return { safe: true };
}

