interface DeeplinkConfig {
  ios: string | ((params: Record<string, string>) => string);
  android: string | ((params: Record<string, string>) => string);
}

interface Route {
  path: string;
  deeplinks: DeeplinkConfig;
  exclude?: string;
  exact?: boolean;
}

// The configuration of routes (extracted from Instagram's code)
const routes: Route[] = [
  {
    path: "/accounts/activity",
    deeplinks: { android: "/_n/news", ios: "news" },
  },
  {
    path: "/notifications",
    deeplinks: { android: "/_n/news", ios: "news" },
  },
  {
    path: "/your_activity",
    deeplinks: { android: "/_n/mainfeed", ios: "mainfeed" },
  },
  {
    path: "/explore/people",
    deeplinks: { android: "/_n/findfriends", ios: "find_friends" },
  },
  {
    path: "/explore/tags/:tag",
    deeplinks: {
      android: (params) => `/explore/tags/${params.tag}`,
      ios: (params) => `tag?name=${params.tag}`,
    },
  },
  {
    path: "/shop/products/:query",
    deeplinks: {
      android: (params) => `/_n/shop/products/${params.query}`,
      ios: (params) =>
        `shopping_home?destination=product_serp&query=${params.query}&title=${params.query}&prior_module=shopping_search_SEO`,
    },
  },
  {
    path: "/explore/locations/:id",
    deeplinks: {
      android: (params) => `/explore/locations/${params.id}`,
      ios: (params) => `location?id=${params.id}`,
    },
  },
  {
    path: "/explore",
    deeplinks: { android: "/_n/explore", ios: "explore" },
  },
  {
    // This route is used when there is no username in the URL (rare case)
    path: "/p/:shortcode",
    deeplinks: {
      android: (params) => `/p/${params.shortcode}`,
      ios: (params) => {
        // If no postId provided, compute it from the shortcode
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `media?id=${postId}`;
      },
    },
  },
  {
    path: "/tv/:shortcode",
    exclude: "/tv/(upload|drafts)",
    deeplinks: {
      android: (params) => `/p/${params.shortcode}`,
      ios: (params) => {
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `media?id=${postId}`;
      },
    },
  },
  {
    path: "/:username/p/:shortcode",
    deeplinks: {
      android: (params) => `/${params.username}/p/${params.shortcode}`,
      ios: (params) => {
        // Here the iOS deeplink expects both username and postId
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `media?username=${params.username}&id=${postId}`;
      },
    },
  },
  {
    path: "/:username/reel/:shortcode",
    deeplinks: {
      android: (params) => `/${params.username}/reel/${params.shortcode}`,
      ios: (params) => {
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `media?username=${params.username}&id=${postId}`;
      },
    },
  },
  {
    path: "/hacked/",
    exact: true,
    deeplinks: { android: "/hacked", ios: "/hacked" },
  },
  {
    path: "/:username",
    exact: true,
    deeplinks: {
      android: (params) => `/_u/${params.username}`,
      ios: (params) => `user?username=${params.username}`,
    },
  },
  {
    path: "/:username/guide/:slug/:guide_id/",
    exact: true,
    deeplinks: {
      android: (params) => `guide?id=${params.guide_id}`,
      ios: (params) => `guide?id=${params.guide_id}`,
    },
  },
  {
    path: "/reel/:shortcode",
    exclude: "/reel/(upload|drafts)",
    deeplinks: {
      android: (params) => `/reels/videos/${params.shortcode}`,
      ios: (params) => {
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `clips_home?id=${postId}`;
      },
    },
  },
  {
    path: "/reels/:shortcode",
    exact: true,
    deeplinks: {
      android: (params) => `/reels/videos/${params.shortcode}`,
      ios: (params) => {
        const postId = params.postId || shortcodeToMediaId(params.shortcode);
        return `clips_home?id=${postId}`;
      },
    },
  },
  {
    path: "/shop/bag/",
    exact: true,
    deeplinks: {
      android: () => '/_n/shopping_bag?entry_point="web"',
      ios: () => '/_n/shopping_bag?entry_point="web"',
    },
  },
  {
    path: "/shop/bag/:merchant_id/",
    exact: true,
    deeplinks: {
      android: (params) =>
        `/_n/shopping_bag?entry_point="web"&merchant_igid=${params.merchant_id}`,
      ios: (params) =>
        `/_n/shopping_bag?entry_point="web"&merchant_igid=${params.merchant_id}`,
    },
  },
  {
    path: "/stories/:username/:shortcode",
    exact: true,
    exclude: "/stories/highlights/:shortcode",
    deeplinks: {
      android: (params) => `/stories/${params.username}/${params.shortcode}`,
      ios: (params) => `/stories/${params.username}/${params.shortcode}`,
    },
  },
  {
    path: "/stories/:username",
    exact: true,
    deeplinks: {
      android: (params) => `/stories/${params.username}`,
      ios: (params) => `/stories/${params.username}`,
    },
  },
  {
    path: "/s/:highlight_code",
    exact: true,
    deeplinks: {
      android: (params) => `/s/${params.highlight_code}`,
      ios: (params) => `/s/${params.highlight_code}`,
    },
  },
  {
    path: "/stories/highlights/:highlight_code",
    exact: true,
    deeplinks: {
      android: (params) => `/s/${params.highlight_code}`,
      ios: (params) => `/s/${params.highlight_code}`,
    },
  },
  {
    path: "/:username/profilecard",
    exact: true,
    deeplinks: {
      android: (params) => `/${params.username}/profilecard`,
      ios: (params) => `user?username=${params.username}`,
    },
  },
];

/**
 * Converts an Instagram shortcode to a numeric media ID.
 * Instagram uses a custom base-64 alphabet.
 */
function shortcodeToMediaId(shortcode: string): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let mediaId = BigInt(0);
  const base = BigInt(64);
  for (let i = 0; i < shortcode.length; i++) {
    const index = BigInt(alphabet.indexOf(shortcode[i]));
    mediaId = mediaId * base + index;
  }
  return mediaId.toString();
}

// This function transforms a route pattern into a regex and extracts parameters.
function matchRoute(
  routePath: string,
  pathname: string,
  exact: boolean = false,
): Record<string, string> | null {
  const segments = routePath.split("/").filter(Boolean);
  let regexStr = "^";
  const paramNames: string[] = [];

  segments.forEach((segment) => {
    if (segment.startsWith(":")) {
      regexStr += "/([^/]+)";
      paramNames.push(segment.slice(1));
    } else {
      regexStr += "/" + segment.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
  });

  regexStr += exact ? "/?$" : "(?:/|$)";
  const regex = new RegExp(regexStr);
  const match = pathname.match(regex);
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  return params;
}

/**
 * Constructs an Instagram deeplink from an Instagram URL for a given os.
 *
 * @param instagramUrl - An Instagram URL (e.g. "https://www.instagram.com/bryanjohnson_/p/DDcHbWZOlmb/")
 * @param os - "ios" or "android"
 * @returns The constructed deeplink or null if no route matches.
 */
export function buildInstagramAppLink(
  instagramUrl: string,
  os: "ios" | "android",
): string | null {
  try {
    const urlObj = new URL(instagramUrl);
    const pathname = urlObj.pathname;
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    for (const route of routes) {
      if (route.exclude) {
        const excludeRegex = new RegExp(route.exclude);
        if (excludeRegex.test(pathname)) continue;
      }
      const paramsFromPath = matchRoute(route.path, pathname, route.exact);
      if (paramsFromPath) {
        // Merge parameters from the path and query string.
        const params = { ...paramsFromPath, ...queryParams };
        // If postId is needed but not provided, compute it using the shortcode.
        if (!params.postId && params.shortcode) {
          params.postId = shortcodeToMediaId(params.shortcode);
        }
        const deeplinkForPlatform = route.deeplinks[os];
        if (typeof deeplinkForPlatform === "function") {
          return deeplinkForPlatform(params);
        } else {
          return deeplinkForPlatform;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Invalid URL", error);
    return null;
  }
}
