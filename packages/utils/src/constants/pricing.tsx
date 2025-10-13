import { INFINITY_NUMBER } from "./misc";
import { type EventsLimit, getPricingForEvents, getLinksForEvents, getDomainsForEvents, getRetentionForEvents } from "../functions/pricing-tiers";

export type PlanFeature = {
  id?: string;
  text: string;
  tooltip?: {
    title: string;
    cta: string;
    href: string;
  };
};

// Create Pro plans for each event tier
const createProPlan = (events: EventsLimit) => ({
  name: "Pro",
  eventsLimit: events,
  price: {
    monthly: getPricingForEvents(events, 'monthly'),
    yearly: getPricingForEvents(events, 'yearly'),
    lifetime: getPricingForEvents(events, 'lifetime'),
    ids: [
      // TODO: Add actual Stripe price IDs
      `price_pro_${events}_monthly`,
      `price_pro_${events}_yearly`,
      `price_pro_${events}_lifetime`,
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
  createProPlan(200000),
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
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const PRO_PLANS = PLANS.filter((plan) => plan.name === "Pro");
export const ENTERPRISE_PLAN = PLANS.find((plan) => plan.name === "Enterprise")!;

export const SELF_SERVE_PAID_PLANS = PRO_PLANS;

export const FREE_WORKSPACES_LIMIT = 2;

export const getPlanFromPriceId = (priceId: string) => {
  return PLANS.find((plan) => 
    'ids' in plan.price && plan.price.ids?.includes(priceId)
  ) || null;
};

export const getPlanDetails = (plan: string) => {
  return PLANS.find(
    (p) => p.name.toLowerCase() === plan.toLowerCase(),
  )!;
};

export const getCurrentPlan = (plan: string) => {
  return (
    PLANS.find((p) => p.name.toLowerCase() === plan.toLowerCase()) || FREE_PLAN
  );
};

export const getNextPlan = (plan?: string | null) => {
  if (!plan) return PRO_PLANS[0]; // Return first Pro tier
  return PRO_PLANS[0];
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
export { calculateEvents, getPricingForEvents, getLinksForEvents, getDomainsForEvents, getRetentionForEvents } from "../functions/pricing-tiers";
export type { EventsLimit } from "../functions/pricing-tiers";