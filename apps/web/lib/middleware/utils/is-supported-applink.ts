import { NextRequest } from "next/server";
import {
  extractDomainAndPath,
  extractDomainWwwAndPath,
  extractPathname,
} from "./applink/extract-generic";
import { buildInstagramAppLink } from "./applink/extract-instagram";

interface AppLink {
  appName: string;
  domains: RegExp[];
  protocol: string;
  android?: string;
}

interface AppLinkParser extends AppLink {
  parse: (
    originalUrl?: string,
    os?: "ios" | "android" | undefined,
  ) => string | undefined;
}

/* ========================
   Spotify-Specific Helper
======================== */

const constructSpotifyDeepLink = (originalUrl: string): string | null => {
  try {
    const parsedUrl = new URL(originalUrl);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    // Expected URL format: /{type}/{id}
    if (segments.length >= 2) {
      const [resourceType, resourceId] = segments;
      if (
        ["track", "album", "artist", "playlist"].includes(
          resourceType.toLowerCase(),
        )
      ) {
        return `${resourceType}/${resourceId}`;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Matches URLs with any subdomains, the given keyword, and any TLD (requires a path after the domain).
export const flex = (keyword: string): RegExp =>
  new RegExp(`^https?:\\/\\/(?:[a-z0-9-]+\\.)*${keyword}\\.[a-z]+\\/.*`, "i");
// Matches URLs with either www. or no subdomain, the given keyword, and any TLD (requires a path).
export const wwwOnly = (keyword: string): RegExp =>
  new RegExp(`^https?:\\/\\/(?:www\\.)?${keyword}\\.[a-z]+\\/.*`, "i");
// Matches URLs with any subdomains but requires a specific domain (including TLD) (requires a path).
export const specificExtension = (domain: string): RegExp => {
  const escapedDomain = domain.replace(/\./g, "\\.");
  return new RegExp(
    `^https?:\\/\\/(?:[a-z0-9-]+\\.)*${escapedDomain}\\/.*`,
    "i",
  );
};
// Matches the exact domain (with optional www.) and allows optional paths.
export const exact = (domain: string): RegExp =>
  new RegExp(
    `^https?:\\/\\/(?:www\\.)?${domain.replace(/\./g, "\\.")}(?:\\/.*)?$`,
    "i",
  );

/* ========================
   AppLinks Array
======================== */

const appLinks: AppLink[] = [
  {
    appName: "youtubemusic",
    domains: [exact("music.youtube.com")],
    protocol: "youtubemusic",
    // android: "com.google.android.apps.youtube.music",
  },
  // must be after youtube music
  {
    appName: "youtube",
    domains: [flex("youtube"), exact("youtu.be")],
    protocol: "vnd.youtube",
    // android: "com.google.android.youtube",
  },
  {
    appName: "amazon",
    domains: [flex("amazon"), flex("amzn")],
    protocol: "com.amazon.mobile.shopping.web",
    android: "com.amazon.mobile.shopping.web",
  },
  {
    appName: "medium",
    domains: [flex("medium")],
    protocol: "medium",
    android: "com.medium.reader",
  },
  {
    appName: "instagram",
    domains: [flex("instagram"), exact("instagr.am")],
    protocol: "instagram",
    android: "com.instagram.android",
  },
  {
    appName: "tiktok",
    domains: [flex("tiktok")],
    // for ios, snssdk1233://tiktok.com/@_bryan_johnson_ works
    protocol: "snssdk1233",
    // for android, tiktok://www.tiktok.com/@_bryan_johnson_
    // and intent://www.tiktok.com/@_bryan_johnson_#Intent;scheme=https;package=com.zhiliaoapp.musically;action=android.intent.action.VIEW;S.browser_fallback_url=https%3A%2F%2Fwww.tiktok.com%2F@_bryan_johnson_;end
    android: "com.zhiliaoapp.musically",
  },
  {
    appName: "x",
    domains: [flex("x.com"), flex("twitter")],
    protocol: "twitter",
    android: "com.twitter.android",
  },
  {
    appName: "linkedin",
    domains: [flex("linkedin"), exact("lnkd.in")],
    protocol: "linkedin",
    android: "com.linkedin.android",
  },
  {
    appName: "spotify",
    domains: [flex("spotify"), exact("spoti.fi")],
    protocol: "spotify",
    android: "com.spotify.music",
  },
  {
    appName: "snapchat",
    domains: [flex("snapchat")],
    protocol: "snapchat",
    android: "com.snapchat.android",
  },
  {
    appName: "telegram",
    domains: [flex("telegram"), exact("t.me")],
    protocol: "tg",
    android: "org.telegram.messenger",
  },
  {
    appName: "messenger",
    domains: [flex("messenger"), exact("m.me")],
    protocol: "messenger",
    android: "com.facebook.orca",
  },
  {
    appName: "whatsapp",
    domains: [flex("whatsapp"), exact("wa.me")],
    protocol: "whatsapp",
    android: "com.whatsapp",
  },
  {
    appName: "airbnb",
    domains: [flex("airbnb")],
    protocol: "airbnb",
    android: "com.airbnb.android",
  },
  {
    appName: "eventbrite",
    domains: [flex("eventbrite")],
    protocol: "eventbrite",
    android: "com.eventbrite.attendee",
  },
  {
    appName: "etsy",
    domains: [flex("etsy")],
    protocol: "etsy",
  },
  {
    appName: "shotgun",
    domains: [flex("shotgun")],
    protocol: "shotguntheapp",
  },
  {
    appName: "ubereats",
    domains: [flex("ubereats")],
    protocol: "ubereats",
  },
  {
    appName: "grubhub",
    domains: [flex("grubhub")],
    protocol: "grubhub",
    // android: "com.grubhub.android",
  },
  {
    appName: "deliveroo",
    domains: [flex("deliveroo")],
    protocol: "deliveroo",
    android: "com.deliveroo.orderapp",
  },
  {
    appName: "yelp",
    domains: [flex("yelp")],
    protocol: "yelp",
    android: "com.yelp.android",
  },
  // {
  //   appName: "applemusic",
  //   domains: [exact("music.apple.com"), exact("itunes.apple.com")],
  //   protocol: "music.apple.com",
  // },
  {
    appName: "facebook",
    domains: [flex("facebook"), exact("fb.com")],
    protocol: "fb",
    android: "com.facebook.katana",
  },
  {
    appName: "discord",
    domains: [flex("discord")],
    protocol: "discord",
    android: "com.discord",
  },
  {
    appName: "kick",
    domains: [flex("kick")],
    protocol: "kick",
    android: "com.kick.app",
  },
  {
    appName: "googlemap",
    domains: [flex("google.com/maps"), exact("maps.app.goo.gl")],
    protocol: "comgooglemapsurl",
    android: "com.google.android.apps.maps",
  },
  {
    appName: "twitch",
    domains: [flex("twitch")],
    protocol: "twitch",
    android: "tv.twitch.android.app",
  },
  // {
  //   appName: "applestore",
  //   domains: [exact("apps.apple.com")],
  //   protocol: "store",
  // },
  // {
  //   appName: "googleapps",
  //   domains: [flex("google.com/apps")],
  //   protocol: "googleapps",
  // },
  {
    appName: "vinted",
    domains: [flex("vinted")],
    protocol: "vinted",
    android: "fr.vinted",
  },
  {
    appName: "skool",
    domains: [flex("skool")],
    protocol: "skool",
    android: "com.skool.skoolcommunities",
  },
  {
    appName: "googlesheets",
    domains: [flex("docs.google.com/spreadsheets/")],
    protocol: "googlesheets",
    android: "com.google.android.apps.docs",
  },
  {
    appName: "googledocs",
    domains: [flex("docs.google.com/document/")],
    protocol: "googledocs",
    android: "com.google.android.apps.docs",
  },
  {
    appName: "walmart",
    domains: [flex("walmart")],
    protocol: "walmart",
    // android: "com.walmart.android",
  },
  {
    appName: "github",
    domains: [flex("github")],
    protocol: "github",
    android: "com.github.android",
  },
];

const appLinkParsers: AppLinkParser[] = appLinks.map((app) => {
  switch (app.appName) {
    // work
    case "youtube":
    case "tiktok":
    case "x":
    // fail
    case "linkedin":
    case "vinted":
    case "kick":
    case "facebook":
      // to test
      // case "eventbrite":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!!app.android && os === "android") {
            const path = extractDomainWwwAndPath(url);
            return parsePath(app, path, os);
          } else {
            return parsePath(app, extractDomainAndPath(url), os);
          }
        },
      };
    // work
    case "googlemap":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!!app.android && os === "android") {
            const path = extractDomainWwwAndPath(url);
            return parsePath(app, path, os);
          } else {
            return parsePath(app, extractDomainWwwAndPath(url), os);
          }
        },
      };
    // work
    case "amazon":
    case "medium":
    case "github":
    case "whatsapp":
    case "googlesheets":
    case "googledocs":
    case "discord":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!!app.android && os === "android") {
            const path = extractDomainAndPath(url);
            return parsePath(app, path, os);
          } else {
            return parsePath(app, extractDomainAndPath(url), os);
          }
        },
      };
    // work
    case "airbnb":
    case "twitch":
    case "snapchat":
      // fail
      // case "skool":
      // to test
      // case "walmart":
      // case "shotgun":
      // case "ubereats":
      // case "grubhub":
      // case "deliveroo":
      // case "yelp":
      // case "etsy":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!!app.android && os === "android") {
            const path = extractDomainWwwAndPath(url);
            return parsePath(app, path, os);
          } else {
            parsePath(app, extractPathname(url), os);
          }
        },
      };
    // work
    case "spotify":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) =>
          parsePath(app, constructSpotifyDeepLink(url), os),
      };
    // fail
    case "telegram":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!!app.android && os === "android") {
            const path = extractDomainAndPath(url);
            return parsePath(app, path, os);
          } else {
            parsePath(
              app,
              (() => {
                // from https://t.me/+PHKxXN-JSyE5Nzk0
                // to tg://join?invite=PHKxXN-JSyE5Nzk0
                // you see the + in the url, so we need to remove it
                return url.replace("https://t.me/+", "tg://join?invite=");
              })(),
              os,
            );
          }
        },
      };
    // fail (on android)
    case "instagram":
      return {
        ...app,
        parse: (url: string, os?: "ios" | "android" | undefined) => {
          if (!os) {
            console.log("Platform header is missing for instagram link", url);
            return url;
          }

          return parsePath(app, buildInstagramAppLink(url, os), os);
        },
      };
    default:
      return { ...app, parse: (url: string) => url };
  }
});

/* ========================
   Utility Functions
======================== */

export const shallShowDirectPreview = (req: NextRequest): boolean => {
  const listOfBrowsers = [
    "linkedinbot",
    "facebookexternalhit",
    "twitterbot",
    "iframely",
    "whatsapp",
    "slackbot",
    "telegrambot",
    "google-pagerenderer",
    "chatgpt",
    "discordbot",
    "skypeuripreview",
    "zoombot",
    "mediumbot",
    "embedly",
    "google-safety",
    "fedicabot",
  ];

  const userAgent = req.headers.get("user-agent") || "";

  // If the user agent includes any of the browsers in the list, return true.
  return listOfBrowsers.some((browser) =>
    userAgent.toLowerCase().includes(browser),
  );
};

export const isNativeBrowser = (req: NextRequest): boolean => {
  const userAgent = req.headers.get("user-agent") || "";

  // First, check if the browser is an in-app browser.
  const inAppRules = ["WebView", "Android.*(wv)"];
  const inAppRegex = new RegExp(`(${inAppRules.join("|")})`, "ig");
  if (Boolean(userAgent.match(inAppRegex))) {
    return false;
  }

  // If not in-app, check if it is one of the native browsers.
  const listOfNativeBrowsers = [
    "chrome",
    "safari",
    "firefox",
    "edge",
    "opera",
    "samsung",
    "brave",
    "yandex",
    "ucbrowser",
    "duckduckgo",
  ];
  return listOfNativeBrowsers.some((browser) =>
    userAgent.toLowerCase().includes(browser),
  );
};

export const isExceptionToDirectRedirect = (req: NextRequest): boolean => {
  const userAgent = req.headers.get("user-agent") || "";

  // Match 'Android <version>' from user agent
  const androidVersionMatch = userAgent.match(/Android (\d+)/);

  return !!androidVersionMatch;
};

export const isLinkedinBot = (req: NextRequest): boolean => {
  const userAgent = req.headers.get("user-agent") || "";
  return userAgent.toLowerCase().includes("linkedinbot") || false;
};

export const isSupportedDirectAppLink = (url: string): boolean =>
  appLinks.some((app) => app.domains.some((pattern) => pattern.test(url)));

export const getDirectAppLink = (
  url: string,
  os: "ios" | "android" | undefined,
): string | undefined => {
  for (const app of appLinkParsers) {
    if (app.domains.some((pattern) => pattern.test(url))) {
      return app.parse(url, os);
    }
  }
};

export const getDirectLink = (
  url: string,
  os: "ios" | "android" | undefined,
): string | undefined => {
  const path = extractDomainAndPath(url);
  if (!path) {
    return;
  }

  if (os === "ios") {
    return `x-safari-${url}`;
  } else if (os === "android") {
    return getIntentUrl("com.android.chrome", path, url);
  } else {
    return `googlechrome://${path}`;
  }
};

const getIntentUrl = (packageName: string, value: string, fallbackUrl?: string) => {
  return `intent://${value}#Intent;scheme=https;package=${packageName}${fallbackUrl ? `;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}` : ""};end`;
};

const parsePath = (
  app: AppLink,
  path: string | null,
  os: "ios" | "android" | undefined,
) => {
  if (!path) {
    return;
  }

  if (!!app.android && os === "android") {
    return getIntentUrl(app.android, path);
  } else {
    return `${app.protocol}://${path}`;
  }
};
