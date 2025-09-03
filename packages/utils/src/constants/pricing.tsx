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
    },
    limits: {
      links: 10,
      clicks: 400,
      sales: 0,
      domains: 1,
      tags: 5,
      folders: 0,
      users: 1,
      ai: 10,
      api: 60,
      retention: "30-day",
    },
  },
  {
    name: "Starter",
    price: {
      lifetime: 59,
      ids: [
        "price_1R2yHmBN5sOoOmBU1CeLs81z", // lifetime (prod)
        "price_1R9AM5BL7DFxjjSQ9e32QsT1", // new monthly (test)
        "price_1RBgCrBN5sOoOmBURR514Ec7", // new monthly (prod)
        "price_1QxoOyBN5sOoOmBUKEy5qXku", // new yearly (test)
        "price_1RBgCCBN5sOoOmBUmBEhPI5E", // new yearly (prod)
      ],
    },
    limits: {
      links: 200,
      clicks: 50_000,
      sales: 0,
      domains: 3,
      tags: 25,
      folders: 3,
      users: 3,
      ai: 1000,
      api: 600,
      retention: "6-month",
    },
    featureTitle: "Everything in Free, plus:",
    features: [
      { id: "links", text: "200 links /month" },
      { id: "tracking", text: "Unlimited tracking" },
      { id: "events", text: "Event tracking (subscription, meetings etc.)" },
      { id: "integrations", text: "100+ integrations incl. Zapier" },
      { id: "domains", text: "3 custom domains" },
      { id: "users", text: "3 team members" },
      { id: "retention", text: "6 months of data" },
      { id: "support", text: "1 month priority support included" },
    ] as PlanFeature[],
  },
  {
    name: "Pro",
    price: {
      lifetime: 99,
      ids: [
        "price_1R9AM5BL7DFxjjSQ9e32QsT1", // new monthly (test)
        "price_1R9AM5BL7DFxjjSQcvE5Yu0T", // new yearly (test)
        "price_1RBgEFBN5sOoOmBUUITvArZY", // new monthly (prod)
        "price_1RBgEXBN5sOoOmBUcJyO7uIs", // new yearly (prod)
      ],
    },
    limits: {
      links: 600,
      clicks: 50_000,
      sales: 30_000_00,
      domains: 5,
      tags: 100,
      folders: 20,
      users: 5,
      ai: 1000,
      api: 3000,
      retention: "1-year",
    },
    featureTitle: "Everything in Starter, plus:",
    features: [
      { id: "links", text: "600 links /month" },
      { id: "sales", text: "Sales tracking up to 30k€ /month" },
      { id: "stripe", text: "Stripe payments integration" },
      { id: "testing", text: "A/B testing" },
      { id: "webhooks", text: "Webhooks" },
      { id: "users", text: "5 team members" },
      { id: "retention", text: "12 months of data" },
      { id: "support", text: "3 months priority support included" },
    ] as PlanFeature[],
  },
  {
    name: "Business",
    price: {
      monthly: null,
      yearly: null,
    },
    limits: {
      links: INFINITY_NUMBER,
      clicks: 50_000,
      sales: 30_000_00,
      domains: 100,
      tags: 100,
      folders: 20,
      users: 10,
      ai: 10000,
      api: 10000,
      retention: "2-year",
    },
    featureTitle: "Everything in Pro and more:",
    features: [
      { id: "links", text: "Unlimited short links" },
      { id: "tracking", text: "Unlimited tracking" },
      { id: "sales", text: "Sales tracking" },
      { id: "users", text: "Unlimited team members" },
      { id: "domains", text: "Unlimited custom domains" },
      { id: "bulk", text: "Bulk link operations" },
      { id: "retention", text: "More than a year of data" },
      { id: "support", text: "Priority support" },
    ] as PlanFeature[],
  },
  // {
  //   name: "Advanced",
  //   price: {
  //     monthly: 300,
  //     yearly: 250,
  //     ids: [
  //       // 2025 pricing
  //       "price_1R8Xw4AlJJEpqkPV6nwdink9", //  yearly
  //       "price_1R3j0qAlJJEpqkPVkfGNXRwb", // monthly
  //       "price_1R8XztAlJJEpqkPVnHmIU2tf", // yearly (test),
  //       "price_1R7ofzAlJJEpqkPV0L2TwyJo", // monthly (test),
  //     ],
  //   },
  //   limits: {
  //     links: 50_000,
  //     clicks: 1_000_000,
  //     sales: 100_000_00,
  //     domains: 250,
  //     tags: INFINITY_NUMBER,
  //     folders: 50,
  //     users: 20,
  //     ai: 1000,
  //     api: 3000,
  //     retention: "5-year",
  //   },
  //   featureTitle: "Everything in Business, plus:",
  //   features: [
  //     {
  //       id: "clicks",
  //       text: "1M tracked clicks/mo",
  //     },
  //     {
  //       id: "links",
  //       text: "50K new links/mo",
  //     },
  //     {
  //       id: "retention",
  //       text: "5-year analytics retention",
  //     },
  //     {
  //       id: "sales",
  //       text: "$100K tracked sales/mo",
  //       tooltip: {
  //         title:
  //           "Use Dub Conversions to track how your link clicks are converting to signups and sales. Limits are based on the total sale amount tracked within a given month.",
  //         cta: "Learn more.",
  //         href: "https://d.to/conversions",
  //       },
  //     },
  //     {
  //       id: "users",
  //       text: "20 users",
  //     },
  //     {
  //       id: "roles",
  //       text: "Folders RBAC",
  //     },
  //     {
  //       id: "whitelabel",
  //       text: "White-labeling support",
  //     },
  //     {
  //       id: "volume",
  //       text: "Lower payout fees",
  //       tooltip: {
  //         title: "Lower fees associated with Partner payouts.",
  //         cta: "Learn more.",
  //         href: "https://dub.co/help/article/partner-payouts",
  //       },
  //     },
  //     {
  //       id: "email",
  //       text: "Branded email domains",
  //     },
  //     {
  //       id: "slack",
  //       text: "Priority Slack support",
  //     },
  //   ] as PlanFeature[],
  // },
  {
    name: "Enterprise",
    price: {
      monthly: null,
      yearly: null,
    },
    limits: {
      links: 250000,
      clicks: 5000000,
      sales: 1000000_00,
      domains: 1000,
      tags: INFINITY_NUMBER,
      folders: INFINITY_NUMBER,
      users: 500,
      ai: 10000,
      api: 10000,
      retention: "Unlimited",
    },
  },
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const STARTER_PLAN = PLANS.find((plan) => plan.name === "Starter")!;
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;
export const BUSINESS_PLAN = PLANS.find((plan) => plan.name === "Business")!;

export const SELF_SERVE_PAID_PLANS = PLANS.filter((p) =>
  ["Starter", "Pro"/*, "Business"*/].includes(p.name),
);

export const FREE_WORKSPACES_LIMIT = 2;

export const getPlanFromPriceId = (priceId: string) => {
  return PLANS.find((plan) => plan.price.ids?.includes(priceId)) || null;
};

export const getPlanDetails = (plan: string) => {
  return SELF_SERVE_PAID_PLANS.find(
    (p) => p.name.toLowerCase() === plan.toLowerCase(),
  )!;
};

export const getCurrentPlan = (plan: string) => {
  return (
    PLANS.find((p) => p.name.toLowerCase() === plan.toLowerCase()) || FREE_PLAN
  );
};

export const getNextPlan = (plan?: string | null) => {
  if (!plan) return STARTER_PLAN;
  return PLANS[
    PLANS.findIndex((p) => p.name.toLowerCase() === plan.toLowerCase()) + 1
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
