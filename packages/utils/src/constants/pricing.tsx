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
      clicks: 600,
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
    name: "Pro",
    // link: "https://dub.co/help/article/pro-plan",
    price: {
      lifetime: 45,
      ids: [
        "price_1R2yHmBN5sOoOmBU1CeLs81z", // lifetime (prod)
        "price_1R9AM5BL7DFxjjSQ9e32QsT1", // new monthly (test)
        "price_1RBgCrBN5sOoOmBURR514Ec7", // new monthly (prod)
        "price_1QxoOyBN5sOoOmBUKEy5qXku", // new yearly (test)
        "price_1RBgCCBN5sOoOmBUmBEhPI5E", // new yearly (prod)
      ],
    },
    limits: {
      links: 1_000,
      clicks: 50_000,
      sales: 20_000_00,
      domains: 10,
      tags: 25,
      folders: 3,
      users: 5,
      ai: 1000,
      api: 600,
      retention: "1-year",
    },
    featureTitle: "Everything in Free, plus:",
    features: [
      { id: "clicks", text: "Unlimited clicks" },
      { id: "links", text: "Unlimited new links" },
      { id: "retention", text: "1-year analytics retention" },
      {
        id: "events",
        text: "Real-time events stream",
      },
      {
        id: "sales",
        text: "20000€ tracked sales/mo",
      },
      { id: "domains", text: "10 domains" },
      { id: "users", text: "5 users" },
      // {
      //   id: "advanced",
      //   text: "Advanced link features",
      //   tooltip: "ADVANCED_LINK_FEATURES",
      // },
      // {
      //   id: "ai",
      //   text: "Unlimited AI credits",
      //   tooltip: {
      //     title:
      //       "Subject to fair use policy – you will be notified if you exceed the limit, which are high enough for frequent usage.",
      //     cta: "Learn more.",
      //     href: "https://dub.co/blog/introducing-dub-ai",
      //   },
      // },
      // {
      //   id: "dotlink",
      //   text: "Free .link domain",
      //   tooltip: {
      //     title:
      //       "All our paid plans come with a free .link custom domain, which helps improve click-through rates.",
      //     cta: "Learn more.",
      //     href: "https://dub.co/help/article/free-dot-link-domain",
      //   },
      // },
      // {
      //   id: "folders",
      //   text: "Link folders",
      // },
      {
        id: "deeplinks",
        text: "Deep links",
      },
    ] as PlanFeature[],
  },
  {
    name: "Business",
    price: {
      monthly: 50,
      yearly: 350,
      ids: [
        "price_1R9AM5BL7DFxjjSQ9e32QsT1", // new monthly (test)
        "price_1R9AM5BL7DFxjjSQcvE5Yu0T", // new yearly (test)
        "price_1RBgEFBN5sOoOmBUUITvArZY", // new monthly (prod)
        "price_1RBgEXBN5sOoOmBUcJyO7uIs", // new yearly (prod)
      ],
    },
    limits: {
      links: 10_000,
      clicks: 250_000,
      sales: 60_000_00,
      domains: 100,
      tags: INFINITY_NUMBER,
      folders: 20,
      users: 10,
      ai: 1000,
      api: 3000,
      retention: "3-year",
    },
    featureTitle: "Everything in Pro, plus:",
    features: [
      {
        id: "clicks",
        text: "Unlimited tracked clicks",
      },
      {
        id: "retention",
        text: "3-year analytics retention",
      },
      {
        id: "sales",
        text: "60k€ tracked sales/mo",
      },
      { id: "domains", text: "100 domains" },
      { id: "users", text: "10 users" },
      // {
      //   id: "partners",
      //   text: "Partner management",
      //   tooltip: {
      //     title: "Use PiMMs Partners to manage and pay out your affiliates.",
      //     cta: "Learn more.",
      //     href: "https://dub.co/partners",
      //   },
      // },
      // {
      //   id: "payouts",
      //   text: "1-click global payouts",
      //   tooltip: {
      //     title: "Send payouts to 180+ countries in 1-click.",
      //     cta: "Learn more.",
      //     href: "https://dub.co/help/article/partner-payouts",
      //   },
      // },
      {
        id: "webhooks",
        text: "Event webhooks",
      },
      // {
      //   id: "tests",
      //   text: "A/B testing",
      // },
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
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;
export const BUSINESS_PLAN = PLANS.find((plan) => plan.name === "Business")!;
export const ADVANCED_PLAN = PLANS.find((plan) => plan.name === "Advanced")!;

export const SELF_SERVE_PAID_PLANS = PLANS.filter((p) =>
  ["Pro", "Business"/*, "Advanced"*/].includes(p.name),
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
  if (!plan) return PRO_PLAN;
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
