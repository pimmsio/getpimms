import { INFINITY_NUMBER } from "./misc";

export type PlanFeature = {
  id?: string;
  text: string;
  tooltip?: {
    title: string;
    cta: string;
    href: string;
  };
};

export type BillingPeriod = "monthly" | "yearly" | "lifetime";
export type BillingCurrency = "EUR" | "USD";

export type PaidPlanId = "tiny" | "solo" | "pro" | "business";
export type PlanId = "free" | PaidPlanId;

type PlanPrice = {
  monthly?: number;
  monthlyUSD?: number;
  yearly?: number;
  yearlyUSD?: number;
  lifetime?: number;
  lifetimeUSD?: number;
  ids?: string[];
};

export type Plan = {
  name: "Free" | "Tiny" | "Solo" | "Pro" | "Business";
  displayName: string;
  price: PlanPrice;
  limits: {
    links: number;
    clicks: number;
    sales: number;
    domains: number;
    tags: number;
    folders: number;
    users: number;
    ai: number;
    api: number;
    utmTemplates: number;
    utmParameters: number;
    bulkLinks: number;
    retention: string;
  };
  featureTitle?: string;
  features?: PlanFeature[];
};

export const PLANS: Plan[] = [
  {
    name: "Free",
    displayName: "Free",
    price: {
      monthly: 0,
      yearly: 0,
      ids: [""],
    },
    limits: {
      links: 5,
      clicks: 200,
      sales: 1_500,
      domains: 0,
      tags: 5,
      folders: 0,
      users: 1,
      ai: 10,
      api: 60,
      utmTemplates: 3,
      utmParameters: 10,
      bulkLinks: 5,
      retention: "30-day",
    },
  },
  {
    name: "Tiny",
    displayName: "Tiny",
    price: {
      monthly: 9,
      monthlyUSD: 9,
      lifetime: 79,
      lifetimeUSD: 79,
      ids: [
        "price_1T31oABN5sOoOmBUHk4FeVJC", // prod monthly EUR
        "price_1T31oABN5sOoOmBUJwRn5Wur", // prod monthly USD
        "price_1T31oABN5sOoOmBU1ryyWPfO", // prod lifetime EUR
        "price_1T31oABN5sOoOmBUSGuITpd8", // prod lifetime USD
      ],
    },
    limits: {
      links: 100,
      clicks: 1_500,
      sales: 5_000,
      domains: 1,
      tags: 25,
      folders: 0,
      users: 1,
      ai: 100,
      api: 600,
      utmTemplates: 5,
      utmParameters: 25,
      bulkLinks: 10,
      retention: "1-year",
    },
    featureTitle: "Everything in Free, plus:",
    features: [
      { id: "links", text: "100 links /month" },
      { id: "clicks", text: "1,500 events tracked /month" },
      { id: "domain", text: "1 custom domain" },
      { id: "qr", text: "Custom QR codes" },
      { id: "retention", text: "1 year of data" },
      { id: "support", text: "Email support" },
    ],
  },
  {
    name: "Solo",
    displayName: "Solo",
    price: {
      monthly: 19,
      monthlyUSD: 19,
      lifetime: 129,
      lifetimeUSD: 129,
      ids: [
        "price_1SvzZDBN5sOoOmBUaN4QLJiP", // prod monthly EUR
        "price_1SvzcOBN5sOoOmBUIfIofPft", // prod monthly USD
        "price_1Svza7BN5sOoOmBUr6pYShpL", // prod lifetime EUR
        "price_1SvzctBN5sOoOmBU91r83ZTS", // prod lifetime USD
        "price_1SshGGBL7DFxjjSQ50AZD1Ta", // staging monthly EUR
        "price_1SshGGBL7DFxjjSQY8rBy8K7", // staging lifetime EUR
      ],
    },
    limits: {
      links: 500,
      clicks: 3_000,
      sales: INFINITY_NUMBER,
      domains: 3,
      tags: 100,
      folders: 1,
      users: 5,
      ai: 1000,
      api: 3000,
      utmTemplates: 10,
      utmParameters: 100,
      bulkLinks: 150,
      retention: "1-year",
    },
    featureTitle: "Everything in Tiny, plus:",
    features: [
      { id: "links", text: "500 links /month" },
      { id: "testing", text: "A/B testing" },
      { id: "webhooks", text: "Webhooks & API" },
      { id: "users", text: "5 team members" },
      { id: "retention", text: "12 months of data" },
      { id: "support", text: "3 months priority support included" },
    ],
  },
  {
    name: "Pro",
    displayName: "Pro",
    price: {
      monthly: 39,
      monthlyUSD: 39,
      yearly: 390,
      yearlyUSD: 390,
      ids: [
        "price_1T31l9BN5sOoOmBUVYAIL5J8", // prod monthly EUR
        "price_1T31l9BN5sOoOmBUBLoFTlIj", // prod monthly USD
        "price_1T31l9BN5sOoOmBUbnOJwy5J", // prod yearly EUR
        "price_1T31l9BN5sOoOmBUiPRj4Bmt", // prod yearly USD
      ],
    },
    limits: {
      links: 1000,
      clicks: 10_000,
      sales: INFINITY_NUMBER,
      domains: 5,
      tags: 100,
      folders: 3,
      users: 5,
      ai: 5000,
      api: 5000,
      utmTemplates: 50,
      utmParameters: 200,
      bulkLinks: 100,
      retention: "1-year",
    },
    featureTitle: "Everything in Solo, plus:",
    features: [
      { id: "links", text: "1,000 links /month" },
      { id: "tracking", text: "10k events tracked /month" },
      { id: "domains", text: "5 custom domains" },
      { id: "bulk", text: "Bulk link operations" },
      { id: "retention", text: "12 months of data" },
      { id: "support", text: "Priority support" },
    ],
  },
  {
    name: "Business",
    displayName: "Business",
    price: {
      monthly: 69,
      monthlyUSD: 69,
      yearly: 690,
      yearlyUSD: 690,
      ids: [
        "price_1SvzeSBN5sOoOmBUsjJUxlm8", // prod monthly EUR
        "price_1SvzhDBN5sOoOmBUX14nOuFE", // prod monthly USD
        "price_1SvzekBN5sOoOmBUoXU1EIhK", // prod yearly EUR
        "price_1SvzhRBN5sOoOmBU7x0EqbTw", // prod yearly USD
        "price_1SshGgBL7DFxjjSQoiz9zKmZ", // staging monthly EUR
        "price_1SshH5BL7DFxjjSQUthdqQQY", // staging yearly EUR
      ],
    },
    limits: {
      links: 2000,
      clicks: 20_000,
      sales: INFINITY_NUMBER,
      domains: 10,
      tags: 100,
      folders: 5,
      users: 10,
      ai: 10000,
      api: 10000,
      utmTemplates: 200,
      utmParameters: 200,
      bulkLinks: 200,
      retention: "2-year",
    },
    featureTitle: "Everything in Pro and more:",
    features: [
      { id: "links", text: "2,000 links /month" },
      { id: "tracking", text: "20k events tracked /month" },
      { id: "users", text: "10 team members" },
      { id: "domains", text: "10 custom domains" },
      { id: "bulk", text: "Bulk link operations" },
      { id: "retention", text: "2 years of data" },
      { id: "support", text: "Priority support" },
    ],
  },
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const TINY_PLAN = PLANS.find((plan) => plan.name === "Tiny")!;
export const SOLO_PLAN = PLANS.find((plan) => plan.name === "Solo")!;
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;
export const BUSINESS_PLAN = PLANS.find((plan) => plan.name === "Business")!;

export const SELF_SERVE_PAID_PLANS = PLANS.filter((p) =>
  ["Tiny", "Solo", "Pro", "Business"].includes(p.name),
);

// Plan sets for withWorkspace({ requiredPlan: ... })
export const REQUIRED_PLAN_ALL = [
  "free",
  "tiny",
  "solo",
  "pro",
  "business",
] as const;
export const REQUIRED_PLAN_WEBHOOKS = ["solo", "pro", "business"] as const;
export const REQUIRED_PLAN_FOLDERS = ["solo", "pro", "business"] as const;
export const REQUIRED_PLAN_BUSINESS_ONLY = ["business"] as const;

export const FREE_WORKSPACES_LIMIT = 2;

export const getPlanFromPriceId = (priceId: string) => {
  return PLANS.find((plan) => plan.price.ids?.includes(priceId)) || null;
};

export function getPlanDetails(plan: string) {
  return SELF_SERVE_PAID_PLANS.find(
    (p) => p.name.toLowerCase() === plan.toLowerCase(),
  )!;
}

export function getPlanDisplayName(plan: Plan): string {
  return plan.displayName ?? plan.name;
}

export function getCurrentPlan(plan: string) {
  return PLANS.find((p) => p.name.toLowerCase() === plan) || FREE_PLAN;
}

export function getPlanPrice(
  planName: string,
  period: BillingPeriod,
  currency: BillingCurrency = "EUR",
): number {
  const plan = PLANS.find((p) => p.name.toLowerCase() === planName);
  if (!plan?.price) return 0;
  const p = plan.price;
  if (currency === "USD") {
    if (period === "monthly") return p.monthlyUSD ?? p.monthly ?? 0;
    if (period === "yearly") return p.yearlyUSD ?? p.yearly ?? 0;
    if (period === "lifetime") return p.lifetimeUSD ?? p.lifetime ?? 0;
  }
  if (period === "monthly") return p.monthly ?? 0;
  if (period === "yearly") return p.yearly ?? 0;
  if (period === "lifetime") return p.lifetime ?? 0;
  return 0;
}

export function getPlansWithBillingOption(
  period: "yearly" | "lifetime",
): Plan[] {
  return SELF_SERVE_PAID_PLANS.filter(
    (p) => (period === "yearly" ? p.price.yearly : p.price.lifetime) != null,
  );
}

export const getNextPlan = (plan?: string | null) => {
  if (!plan) return TINY_PLAN;
  const idx = PLANS.findIndex((p) => p.name.toLowerCase() === plan);
  return PLANS[idx + 1] ?? PLANS[PLANS.length - 1];
};

export const isDowngradePlan = (currentPlan: string, newPlan: string) => {
  const currentPlanIndex = PLANS.findIndex(
    (p) => p.name.toLowerCase() === currentPlan.toLowerCase(),
  );
  const newPlanIndex = PLANS.findIndex(
    (p) => p.name.toLowerCase() === newPlan.toLowerCase(),
  );
  return currentPlanIndex > newPlanIndex;
};
