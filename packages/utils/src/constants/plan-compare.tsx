import { ReactNode } from "react";
import { nFormatter } from "../functions/nformatter";
import { INFINITY_NUMBER } from "./misc";
import { PLANS } from "./pricing";

export const PLAN_COMPARE_FEATURES: {
  category: string;
  href: string;
  features: {
    text:
      | string
      | ((d: { id: string; plan: (typeof PLANS)[number] }) => ReactNode);
    href?: string;
    check?:
      | boolean
      | {
          default?: boolean;
          free?: boolean;
          starter?: boolean;
          pro?: boolean;
          business?: boolean;
          enterprise?: boolean;
        };
  }[];
}[] = [
  {
    category: "Links",
    href: "https://pimms.io/", // TODO: update to https://pimms.io/links
    features: [
      {
        text: ({ plan }) => (
          <>
            <strong>
              {plan.limits.links === INFINITY_NUMBER
                ? "Unlimited"
                : `${nFormatter(plan.limits.links)} new`}
            </strong>{" "}
            links{plan.limits.links === INFINITY_NUMBER ? "" : "/month"}
          </>
        ),
      },
      {
        text: () => (
          <>
            <strong>Unlimited</strong> clicks
          </>
        ),
      },
      {
        check: {
          free: false,
          default: true,
        },
        text: "Redirect to mobile apps",
        // href: "https://dub.co/help/article/custom-domain-deep-links",
      },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: ({ plan }) => (
      //     <>
      //       <strong>
      //         {plan.limits.folders === INFINITY_NUMBER
      //           ? "Unlimited"
      //           : nFormatter(plan.limits.folders)}
      //       </strong>{" "}
      //       folders
      //     </>
      //   ),
      // },
      {
        text: "Custom QR codes",
        // href: "https://dub.co/help/article/custom-qr-codes",
      },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Custom link previews",
      //   // href: "https://dub.co/help/article/custom-link-previews",
      // },
      {
        check: {
          free: false,
          starter: false,
          default: true,
        },
        text: "A/B testing",
      },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Link cloaking",
      //   // href: "https://dub.co/help/article/link-cloaking",
      // },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Link expiration",
      //   // href: "https://dub.co/help/article/link-expiration",
      // },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Password protection",
      //   // href: "https://dub.co/help/article/password-protected-links",
      // },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Device targeting",
      //   // href: "https://dub.co/help/article/device-targeting",
      // },
      // {
      //   check: {
      //     free: false,
      //     default: true,
      //   },
      //   text: "Geo targeting",
      //   // href: "https://dub.co/help/article/geo-targeting",
      // },
      // {
      //   check: {
      //     free: false,
      //     pro: false,
      //     default: true,
      //   },
      //   text: "A/B testing",
      // },
    ],
  },
  {
    category: "Analytics",
    href: "https://pimms.io",
    features: [
      {
        check: {
          default: false,
          starter: true,
          pro: true,
          business: true,
          enterprise: true,
        },
        text: "Event tracking",
        // href: "https://dub.co/help/article/dub-conversions",
      },
      {
        text: ({ plan }) => (
          <>
            <strong>
              Unlimited
            </strong>{" "}
            tracked events
          </>
        ),
        // href: "https://dub.co/help/article/dub-analytics-limits",
      },
      {
        text: ({ plan }) => (
          <>
            <strong>{plan.limits.retention}</strong> retention
          </>
        ),
      },
      // {
      //   check: {
      //     default: false,
      //     pro: true,
      //     business: true,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "Real-time events stream",
      //   // href: "https://dub.co/help/article/real-time-events-stream",
      // },
      {
        check: {
          default: false,
          starter: true,
          pro: true,
          business: true,
          enterprise: true,
        },
        text: "100+ integrations incl. Zapier",
      },
    ],
  },
  {
    category: "Sales tracking",
    href: "https://pimms.io",
    features: [
      // {
      //   check: {
      //     default: false,
      //     pro: false,
      //     business: true,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "Create your own affiliate program",
      //   // href: "https://dub.co/help/article/dub-partners",
      // },
      {
        check: {
          default: false,
          pro: true,
          business: true,
          enterprise: true,
        },
        text: ({ id, plan }) =>
          id === "free" || id === "starter" ? (
            "No sales tracking"
          ) : (
            <>
              <strong>
                {plan.name === "Business"
                  ? "Unlimited"
                  : `€${nFormatter(plan.limits.sales / 100)}`}
              </strong>{" "}
              tracked sales
              {plan.name === "Business" ? "" : "/mo"}
            </>
          ),
      },
      {
        check: {
          default: false,
          pro: true,
          business: true,
          enterprise: true,
        },
        text: "Stripe payments integration",
      },
      // {
      //   check: {
      //     default: false,
      //     business: true,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "1-click global payouts",
      //   // href: "https://dub.co/help/article/partner-payouts",
      // },
      // {
      //   check: {
      //     default: false,
      //     business: true,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: ({ id }) =>
      //     id === "free" || id === "pro" ? (
      //       "No payouts"
      //     ) : (
      //       <>
      //         <strong>
      //           {
      //             {
      //               business: "7%",
      //               advanced: "5%",
      //               enterprise: "3%",
      //             }[id]
      //           }
      //         </strong>{" "}
      //         payout fees
      //       </>
      //     ),
      //   // href: "https://dub.co/help/article/partner-payouts#payout-fees-and-timing",
      // },
      // {
      //   check: {
      //     default: false,
      //     business: true,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "Tax compliance",
      //   // href: "https://dub.co/help/article/partner-payouts#tax-compliance",
      // },
      // {
      //   check: {
      //     default: false,
      //     business: false,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "White-labeling support",
      //   // href: "https://dub.co/help/article/dub-partners#white-labeled-in-app-dashboard",
      // },
      // {
      //   check: {
      //     default: false,
      //     business: false,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "Branded email domains",
      // },
    ],
  },
  {
    category: "Domains",
    href: "https://pimms.io",
    features: [
      {
        text: ({ plan }) => (
          <>
            <strong>
              {plan.name === "Enterprise" || plan.name === "Business"
                ? "Unlimited"
                : nFormatter(plan.limits.domains, { full: true })}
            </strong>{" "}
            custom domains
          </>
        ),
      },
      {
        text: () => <>SSL certificates</>,
      },
      // {
      //   check: {
      //     default: true,
      //     free: false,
      //   },
      //   text: () => (
      //     <>
      //       Premium <strong>dub.link</strong> domain
      //     </>
      //   ),
      //   // href: "https://dub.co/help/article/default-dub-domains#premium-dublink-domain",
      // },
      // {
      //   check: {
      //     default: true,
      //     free: false,
      //   },
      //   text: () => (
      //     <>
      //       Free <strong>.link</strong> domain
      //     </>
      //   ),
      //   // href: "https://dub.co/help/article/free-dot-link-domain",
      // },
    ],
  },
  {
    category: "API",
    href: "https://pimms.io",
    features: [
      {
        text: "API Access",
        // href: "https://dub.co/docs/api-reference/introduction",
      },
      // {
      //   text: "Native SDKs",
      //   // href: "https://dub.co/docs/sdks/overview",
      // },
      {
        text: ({ id, plan }) => (
          <>
            <strong>
              {id === "enterprise"
                ? "Custom"
                : nFormatter(plan.limits.api) + "/min"}
            </strong>{" "}
            rate limit
          </>
        ),
      },
      {
        check: {
          default: false,
          pro: true,
          business: true,
          enterprise: true,
        },
        text: "Event webhooks",
        // href: "https://dub.co/docs/concepts/webhooks/introduction",
      },
    ],
  },
  {
    category: "Workspace",
    href: "https://pimms.io",
    features: [
      {
        text: ({ plan }) => (
          <>
            <strong>
              {plan.name === "Enterprise" || plan.name === "Business"
                ? "Unlimited"
                : nFormatter(plan.limits.users)}
            </strong>{" "}
            user
            {plan.limits.users === 1 ? "" : "s"}
          </>
        ),
      },
      {
        text: ({ plan }) => (
          <>
            <strong>
              {plan.limits.tags === INFINITY_NUMBER
                ? "Unlimited"
                : nFormatter(plan.limits.tags)}
            </strong>{" "}
            tags
          </>
        ),
        // href: "https://dub.co/help/article/how-to-use-tags",
      },
      {
        text: "UTM templates",
        // href: "https://dub.co/help/article/how-to-create-utm-templates",
      },
      {
        check: {
          default: false,
          business: true,
          enterprise: true,
        },
        text: "Bulk link operations",
      },
      // {
      //   check: {
      //     default: false,
      //     advanced: true,
      //     enterprise: true,
      //   },
      //   text: "Role-based access control",
      // },
      // {
      //   check: {
      //     default: false,
      //     enterprise: true,
      //   },
      //   text: "SAML/SSO",
      //   // href: "https://dub.co/help/category/saml-sso",
      // },
      // {
      //   check: {
      //     default: false,
      //     enterprise: true,
      //   },
      //   text: "Custom SLA",
      // },
      // {
      //   check: {
      //     default: false,
      //     enterprise: true,
      //   },
      //   text: "Audit logs",
      // },
    ],
  },
  {
    category: "Support",
    href: "https://pimms.io", // TODO: update to https://dub.co/contact/support
    features: [
      {
        text: ({ id }) => (
          <>
            <strong>
              {
                {
                  free: "Basic support",
                  starter: "1 month priority support",
                  pro: "3 months priority support",
                  business: "Priority support",
                  enterprise: "Priority with SLA",
                }[id]
              }
            </strong>
          </>
        ),
      },
      // {
      //   check: {
      //     default: false,
      //     enterprise: true,
      //   },
      //   text: () => (
      //     <>
      //       <strong>Dedicated</strong> success manager
      //     </>
      //   ),
      // },
    ],
  },
];
