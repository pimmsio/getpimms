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

export const PLANS = [
  {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
      ids: [""],
    },
    limits: {
      links: 5,
      clicks: 200,
      sales: 0,
      domains: 1,
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
    name: "Pro",
    price: {
      monthly: 19,
      lifetime: 129,
      ids: [
        "price_1SQBYHBN5sOoOmBUxCM8iTy8", // prod monthly
        "price_1SQBYHBN5sOoOmBUs2reZG2N", // prod lifetime
        "price_1SshGGBL7DFxjjSQ50AZD1Ta", // staging monthly
        "price_1SshGGBL7DFxjjSQY8rBy8K7", // staging lifetime
      ],
    },
    limits: {
      links: 500,
      clicks: 3_000,
      sales: 30_000_00,
      domains: 3,
      tags: 100,
      folders: 1,
      users: 5,
      ai: 1000,
      api: 3000,
      utmTemplates: 10,
      utmParameters: 100,
      bulkLinks: 20,
      retention: "1-year",
    },
    featureTitle: "Everything in Free, plus:",
    features: [
      { id: "links", text: "50 links /month" },
      { id: "sales", text: "Sales tracking up to 30k€ /month" },
      { id: "stripe", text: "Stripe payments integration" },
      { id: "testing", text: "A/B testing" },
      { id: "webhooks", text: "Webhooks & API" },
      { id: "users", text: "5 team members" },
      { id: "retention", text: "12 months of data" },
      { id: "support", text: "3 months priority support included" },
    ] as PlanFeature[],
  },
  {
    name: "Business",
    price: {
      monthly: 69,
      yearly: 690,
      ids: [
        "price_1SQBqRBN5sOoOmBUMXE1IUA8", // prod monthly
        "price_1SQBqRBN5sOoOmBUkOtzh1lV", // prod yearly
        "price_1SshGgBL7DFxjjSQoiz9zKmZ", // staging monthly
        "price_1SshH5BL7DFxjjSQUthdqQQY", // staging yearly
      ],
    },
    limits: {
      links: 2000,
      clicks: 20_000,
      sales: 30_000_00,
      domains: 10,
      tags: 100,
      folders: 5,
      users: 10,
      ai: 10000,
      api: 10000,
      utmTemplates: INFINITY_NUMBER,
      utmParameters: INFINITY_NUMBER,
      bulkLinks: 200,
      retention: "2-year",
    },
    featureTitle: "Everything in Pro and more:",
    features: [
      { id: "links", text: "200 links /month" },
      { id: "tracking", text: "20k events tracked /month" },
      { id: "sales", text: "Sales tracking" },
      { id: "users", text: "Unlimited team members" },
      { id: "domains", text: "10 custom domains" },
      { id: "bulk", text: "Bulk link operations" },
      { id: "retention", text: "More than a year of data" },
      { id: "support", text: "Priority support" },
    ] as PlanFeature[],
  },
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;
export const BUSINESS_PLAN = PLANS.find((plan) => plan.name === "Business")!;

export const SELF_SERVE_PAID_PLANS = PLANS.filter((p) =>
  ["Pro", "Business"].includes(p.name),
);

export const FREE_WORKSPACES_LIMIT = 2;

export const getPlanFromPriceId = (priceId: string) => {
  return PLANS.find((plan) => plan.price.ids?.includes(priceId)) || null;
};

export const getPlanDetails = (plan: string) => {
  return SELF_SERVE_PAID_PLANS.find(
    (p) => p.name.toLowerCase() === plan,
  )!;
};

export const getCurrentPlan = (plan: string) => {
  return (
    PLANS.find((p) => p.name.toLowerCase() === plan) || FREE_PLAN
  );
};

export const getNextPlan = (plan?: string | null) => {
  if (!plan) return PRO_PLAN;
  return PLANS[
    PLANS.findIndex((p) => p.name.toLowerCase() === plan) + 1
  ];
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
