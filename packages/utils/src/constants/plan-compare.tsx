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
          pro?: boolean;
          business?: boolean;
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
          default: true,
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
      {
        check: {
          default: false,
          pro: true,
          business: true,
        },
        text: "100+ integrations incl. Zapier",
      },
      {
        check: {
          default: false,
          pro: true,
          business: true,
        },
        text: "Analytics export",
      },
    ],
  },
  {
    category: "Sales tracking",
    href: "https://pimms.io",
    features: [
      {
        check: {
          default: false,
          pro: true,
          business: true,
        },
        text: ({ id, plan }) =>
          id === "free" ? (
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
        },
        text: "Stripe payments integration",
      },
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
              {plan.limits.domains === INFINITY_NUMBER
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
              {nFormatter(plan.limits.api) + "/min"}
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
              {plan.name === "Business" ? "Unlimited" : nFormatter(plan.limits.users)}
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
        },
        text: "Bulk link operations",
      },
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
                  pro: "3 months priority support",
                  business: "Priority support",
                }[id]
              }
            </strong>
          </>
        ),
      },
    ],
  },
];
