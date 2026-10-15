// Heuristic phishing detection for link destinations.
// Google Safe Browsing only knows about pages once they've been reported, which
// usually takes days for freshly deployed kits on free hosting platforms
// (e.g. paypal-login.wasmer.app). These rules catch them at creation time.

// Free / instant hosting platforms that give anyone a branded-looking subdomain
const FREE_HOSTING_SUFFIXES = [
  "wasmer.app",
  "koyeb.app",
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "workers.dev",
  "web.app",
  "firebaseapp.com",
  "github.io",
  "glitch.me",
  "onrender.com",
  "herokuapp.com",
  "replit.app",
  "repl.co",
  "surge.sh",
  "fly.dev",
  "deno.dev",
  "railway.app",
  "webflow.io",
  "framer.website",
  "framer.app",
  "weebly.com",
  "wixsite.com",
  "000webhostapp.com",
  "blogspot.com",
  "square.site",
  "godaddysites.com",
  "mystrikingly.com",
  "carrd.co",
  "azurewebsites.net",
  "trycloudflare.com",
  "ngrok-free.app",
  "ngrok.io",
  "ipfs.io",
];

// Brands commonly impersonated by phishing kits (payments, banks, delivery, tech)
const IMPERSONATED_BRANDS = [
  "paypal",
  "scalapay",
  "klarna",
  "wise",
  "stripe",
  "revolut",
  "n26",
  "uber",
  "apple",
  "icloud",
  "microsoft",
  "outlook",
  "office365",
  "netflix",
  "amazon",
  "facebook",
  "instagram",
  "whatsapp",
  "binance",
  "coinbase",
  "metamask",
  "ledger",
  "santander",
  "bnp",
  "creditagricole",
  "societegenerale",
  "intesa",
  "unicredit",
  "postepay",
  "bbva",
  "caixabank",
  "hsbc",
  "barclays",
  "chase",
  "wellsfargo",
  "ameli",
  "impots",
  "laposte",
  "chronopost",
  "colissimo",
  "dhl",
  "fedex",
  "usps",
  "docusign",
  "dropbox",
];

// Words phishing kits put in hostnames (multi-language), including typo variants
const PHISHING_WORDS = [
  "login",
  "logiin",
  "signin",
  "verify",
  "verif",
  "secure",
  "account",
  "accedi",
  "acceder",
  "accesso",
  "conferma",
  "unlock",
  "wallet",
  "billing",
  "recovery",
];

// Path signature of the kit seen on wasmer.app: /wp-content/it/it/..., /wp-content/us/us/...
const KIT_PATH_REGEX = /\/wp-content\/[a-z]{2}\/[a-z]{2}\//i;

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

const matchesWord = (tokens: string[], words: string[]) =>
  words.find((w) =>
    tokens.some((t) => t === w || (w.length >= 5 && t.includes(w))),
  );

export function checkPhishingHeuristics(
  url: string,
): { suspicious: false } | { suspicious: true; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { suspicious: false };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (KIT_PATH_REGEX.test(parsed.pathname)) {
    return { suspicious: true, reason: "known phishing kit path pattern" };
  }

  const hostingSuffix = FREE_HOSTING_SUFFIXES.find((s) =>
    hostname.endsWith(`.${s}`),
  );
  if (!hostingSuffix) {
    return { suspicious: false };
  }

  // only look at the user-controlled part (e.g. "paypal-login" in paypal-login.wasmer.app)
  const tokens = tokenize(hostname.slice(0, -hostingSuffix.length - 1));

  const brand = matchesWord(tokens, IMPERSONATED_BRANDS);
  if (brand) {
    return {
      suspicious: true,
      reason: `brand "${brand}" on free hosting (${hostingSuffix})`,
    };
  }

  const word = matchesWord(tokens, PHISHING_WORDS);
  if (word) {
    return {
      suspicious: true,
      reason: `phishing keyword "${word}" on free hosting (${hostingSuffix})`,
    };
  }

  return { suspicious: false };
}
