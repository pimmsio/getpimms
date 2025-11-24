import { INFINITY_NUMBER } from "./misc";
import { type EventsLimit, getPricingForEvents, getLinksForEvents, getDomainsForEvents, getRetentionForEvents, getFakePriceId } from "../functions/pricing-tiers";

export type PlanFeature = {
  id?: string;
  text: string;
  tooltip?: {
    title: string;
    cta: string;
    href: string;
  };
};

export type PlanLimits = {
  links: number;
  clicks: number;
  events: number;
  sales: number;
  domains: number;
  tags: number;
  folders: number;
  users: number;
  ai: number;
  api: number;
  retention: string;
};

export type PlanPrice = {
  monthly?: number | null;
  yearly?: number | null;
  lifetime?: number | null;
  ids?: string[];
};

export type BasePlan = {
  name: string;
  price: PlanPrice;
  limits: PlanLimits;
  featureTitle?: string;
  features?: PlanFeature[];
};

export type ProPlan = BasePlan & {
  name: "Pro";
  eventsLimit: EventsLimit;
};

export type Plan = BasePlan | ProPlan;

// Create Pro plans for each event tier
const createProPlan = (events: EventsLimit): ProPlan => ({
  name: "Pro",
  eventsLimit: events,
  price: {
    monthly: getPricingForEvents(events, 'monthly'),
    yearly: getPricingForEvents(events, 'yearly'),
    lifetime: events === 100000 ? null : getPricingForEvents(events, 'lifetime'),
    ids: [
      getFakePriceId(events, 'monthly'),
      getFakePriceId(events, 'yearly'),
      ...(events === 100000 ? [] : [getFakePriceId(events, 'lifetime')]),
    ],
  },
  limits: {
    links: getLinksForEvents(events),
    clicks: events,
    events: events,
    sales: INFINITY_NUMBER,
    domains: getDomainsForEvents(events),
    tags: INFINITY_NUMBER,
    folders: INFINITY_NUMBER,
    users: INFINITY_NUMBER,
    ai: 1000,
    api: 3000,
    retention: getRetentionForEvents(events),
  },
  featureTitle: "Everything included:",
  features: [
    { id: "links", text: `${getLinksForEvents(events)} smart links /month` },
    { id: "events", text: `${events.toLocaleString()} tracking events /month (click, lead, sale)` },
    { id: "integrations", text: "100+ integrations incl. Zapier" },
    { id: "stripe", text: "Support Stripe payments" },
    { id: "testing", text: "A/B testing" },
    { id: "webhooks", text: "Webhooks" },
    { id: "utm", text: "Unlimited UTM" },
    { id: "domains", text: getDomainsForEvents(events) === Infinity ? "Unlimited custom domains" : `${getDomainsForEvents(events)} custom domains` },
    { id: "users", text: "Unlimited team members" },
    { id: "retention", text: getRetentionForEvents(events) === '6-month' ? "6 months of data" : "12 months of data" },
    { id: "support", text: "3 months priority support included" },
  ] as PlanFeature[],
});

export const PLANS: Plan[] = [
  {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      links: 10,
      clicks: 400,
      events: 400,
      sales: INFINITY_NUMBER, // Free plan now includes sales tracking
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
      events: 400,
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
      { id: "links", text: "10 smart links /month" },
      { id: "events", text: "400 tracking events /month" },
      { id: "tracking", text: "Event tracking (clicks, leads, sales)" },
      { id: "mobile", text: "Mobile app redirects" },
      { id: "qr", text: "Custom QR codes" },
      { id: "domains", text: "1 custom domain" },
    ] as PlanFeature[],
  },
  // Pro plans for each event tier
  createProPlan(5000),
  createProPlan(20000),
  createProPlan(40000),
  createProPlan(100000),
  {
    name: "Enterprise",
    price: {
      monthly: null,
      yearly: null,
    },
    limits: {
      links: INFINITY_NUMBER,
      clicks: INFINITY_NUMBER,
      events: INFINITY_NUMBER,
      sales: INFINITY_NUMBER,
      domains: INFINITY_NUMBER,
      tags: INFINITY_NUMBER,
      folders: INFINITY_NUMBER,
      users: INFINITY_NUMBER,
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
  {
    name: "Enterprise",
    price: {
      monthly: null,
      yearly: null,
    },
    limits: {
      links: 250000,
      clicks: 5000000,
      events: INFINITY_NUMBER,
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
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro" && "eventsLimit" in plan) as ProPlan;
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

// Export event-based utilities
export { 
  calculateEvents, 
  getPricingForEvents, 
  getLinksForEvents, 
  getDomainsForEvents, 
  getRetentionForEvents,
  getLookupKey,
  getFakePriceId,
  getEventsLimitFromLookupKey
} from "../functions/pricing-tiers";
export type { EventsLimit } from "../functions/pricing-tiers";