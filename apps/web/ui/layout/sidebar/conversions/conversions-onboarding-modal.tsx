"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { X } from "@/ui/shared/icons";
import { CustomSetupSupportContent } from "@/ui/onboarding/custom-setup-support-modal";
import {
  canonicalizeProviderId,
  isProviderCompleted,
} from "@/ui/onboarding/canonical-provider-id";
import {
  AnimatedSizeContainer,
  BlurImage,
  BookOpen,
  Modal,
} from "@dub/ui";
import { cn, fetcher } from "@dub/utils";
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  Code2,
  CreditCard,
  FileText,
  Globe,
  Loader2,
  Magnet,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";
import { Brevo } from "./icons/brevo";
import { Stripe } from "./icons/stripe";
import { SystemeIO } from "./icons/systemeio";
import { Tally } from "./icons/tally";
import { CalcomOnboardingWizard } from "@/ui/onboarding/integrations/calcom-onboarding-wizard";
import { CalendlyOnboardingWizard } from "@/ui/onboarding/integrations/calendly-onboarding-wizard";
import { BrevoOnboardingWizard } from "@/ui/onboarding/integrations/brevo-onboarding-wizard";
import { ElementorOnboardingWizard } from "@/ui/onboarding/integrations/elementor-onboarding-wizard";
import { FramerOnboardingWizard } from "@/ui/onboarding/integrations/framer-onboarding-wizard";
import { PodiaOnboardingWizard } from "@/ui/onboarding/integrations/podia-onboarding-wizard";
import { StripeOnboardingWizard } from "@/ui/onboarding/integrations/stripe-onboarding-wizard";
import { SystemeioOnboardingWizard } from "@/ui/onboarding/integrations/systemeio-onboarding-wizard";
import { TallyOnboardingWizard } from "@/ui/onboarding/integrations/tally-onboarding-wizard";
import { WebflowOnboardingWizard } from "@/ui/onboarding/integrations/webflow-onboarding-wizard";

const EXCLUDED_PROVIDER_IDS = new Set<ProviderId>([
  // Temporarily disabled (keep consistent with Today onboarding list).
  "hubspotMeetings",
  "lemcal",
  "lovable",
  "shopify",
  "shopifyPayments",
  "typeform",
]);

type SetupCategory =
  | "leadMagnet"
  | "thankyou"
  | "website"
  | "calendars"
  | "payments"
  | "automations"
  | "forms"
  | "apis";

type ProviderId =
  | "leadMagnet"
  | "thankyou"
  | "framer"
  | "webflow"
  | "lovable"
  | "wordpressElementor"
  | "systemeioWebsite"
  | "shopify"
  | "calDotCom"
  | "calendly"
  | "lemcal"
  | "hubspotMeetings"
  | "brevoMeeting"
  | "iclosedMeeting"
  | "stripe"
  | "systemeio"
  | "shopifyPayments"
  | "podia"
  | "podiaWebsite"
  | "zapier"
  | "make"
  | "tally"
  | "brevoForm"
  | "systemeioForm"
  | "typeform"
  | "otherWebsite"
  | "otherCalendars"
  | "otherPayments"
  | "otherAutomations"
  | "otherForms"
  | "otherApis"
  | "trackLeadApi"
  | "trackSaleApi";

type Provider = {
  id: ProviderId;
  name: string;
  shortName?: string;
  category: SetupCategory;
  icon?: any; // React component OR string path to an image in /public
  guideKey?: string; // used to map to /api/pimms/guides
  guideUrl?: string;
  guides?: Array<{ title: string; href: string; thumbnail?: string | null }>;
  thumbnail?: string;
  externalUrl?: string; // direct integration page (e.g., Zapier)
  setupTime?: string; // human-friendly estimate, e.g. "< 1 min", "10 min"
  isMostPopular?: boolean;
};

const PROVIDERS: Provider[] = [
  // No setup
  {
    id: "leadMagnet",
    name: "Link magnets",
    shortName: "Link magnets",
    category: "leadMagnet",
    setupTime: "< 1 min",
    isMostPopular: true,
  },
  {
    id: "thankyou",
    name: "Via thank you page",
    shortName: "Via thank you page",
    category: "thankyou",
    setupTime: "< 1 min",
  },
  // Website
  {
    id: "framer",
    name: "Framer",
    category: "website",
    icon: "/static/symbols/integrations/framer.svg",
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/how-to-track-framer-form-submissions-marketing-attribution",
      },
    ],
    setupTime: "30 min",
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "website",
    icon: "/static/symbols/integrations/webflow.svg",
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/how-to-track-webflow-form-submissions-marketing-attribution",
      },
    ],
    setupTime: "30 min",
  },
  {
    id: "lovable",
    name: "Lovable",
    category: "website",
    icon: "/static/symbols/integrations/lovable.svg",
    guideKey: "lovable",
    setupTime: "30 min",
  },
  {
    id: "wordpressElementor",
    name: "WordPress / Elementor",
    category: "website",
    icon: "/static/symbols/integrations/wordpress.svg",
    guideKey: "wordpress",
    setupTime: "30 min",
  },
  {
    id: "systemeioWebsite",
    name: "Systeme.io",
    category: "website",
    icon: SystemeIO,
    guideKey: "systeme.io",
    setupTime: "30 min",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "website",
    icon: "/static/symbols/integrations/shopify.svg",
    guideKey: "shopify",
    setupTime: "30 min",
  },
  {
    id: "podiaWebsite",
    name: "Podia",
    category: "website",
    icon: "/static/symbols/integrations/podia.svg",
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/how-to-track-podia-stripe-payments",
      },
    ],
    setupTime: "30 min",
  },
  { id: "otherWebsite", name: "Other", category: "website" },
  // Calendars
  {
    id: "calDotCom",
    name: "Cal.com",
    category: "calendars",
    icon: "/static/symbols/integrations/calcom.svg",
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/calcom-direct-webhook-integration",
      },
      {
        title: "Zapier setup",
        href: "https://pimms.io/guides/how-to-track-cal-com-bookings-marketing-attribution",
      },
    ],
    setupTime: "5 min",
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "calendars",
    icon: "/static/symbols/integrations/calendly.svg",
    guideKey: "calendly",
    setupTime: "5 min",
  },
  {
    id: "lemcal",
    name: "Lemcal",
    category: "calendars",
    icon: "/static/symbols/integrations/lemcal.svg",
    guideKey: "lemcal",
    setupTime: "5 min",
  },
  {
    id: "hubspotMeetings",
    name: "HubSpot Meetings",
    shortName: "HubSpot",
    category: "calendars",
    icon: "/static/symbols/integrations/hubspot.svg",
    guideKey: "hubspot",
    setupTime: "5 min",
  },
  {
    id: "brevoMeeting",
    name: "Brevo Meetings",
    shortName: "Brevo",
    category: "calendars",
    icon: Brevo,
    guideKey: "brevo",
    guideUrl: "https://pimms.io/guides/how-to-track-brevo-forms-and-meetings-webhook-integration",
    setupTime: "5 min",
  },
  {
    id: "iclosedMeeting",
    name: "iClosed",
    shortName: "iClosed",
    category: "calendars",
    icon: "/static/symbols/integrations/iclosed.svg",
    guides: [
      {
        title: "Zapier setup",
        href: "https://pimms.io/guides/how-to-track-iclosed-bookings-marketing-attribution",
      },
    ],
    setupTime: "5 min",
  },
  { id: "otherCalendars", name: "Other", category: "calendars" },
  // Payments
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    icon: Stripe,
    guides: [
      {
        title: "Setup guide",
        href: "https://pimms.io/guides/how-to-track-stripe-sales-marketing-attribution",
      },
      {
        title: "Developer guide (Stripe Checkout)",
        href: "https://pimms.io/guides/track-stripe-checkout-conversions-with-pimms",
      },
    ],
  },
  {
    id: "systemeio",
    name: "Systeme.io",
    category: "payments",
    icon: SystemeIO,
    guideKey: "systeme.io",
  },
  {
    id: "shopifyPayments",
    name: "Shopify Payments",
    shortName: "Shopify",
    category: "payments",
    icon: "/static/symbols/integrations/shopify.svg",
    guideKey: "shopify",
  },
  {
    id: "podia",
    name: "Podia",
    category: "payments",
    icon: "/static/symbols/integrations/podia.svg",
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/how-to-track-podia-stripe-payments",
      },
    ],
  },
  { id: "otherPayments", name: "Other", category: "payments" },
  // Automations
  {
    id: "zapier",
    name: "Zapier",
    category: "automations",
    icon: "/static/symbols/integrations/zapier.svg",
    guideKey: "zapier",
    externalUrl: "https://zapier.com/apps/pimms/integrations",
    setupTime: "10 min",
  },
  {
    id: "make",
    name: "Make.com",
    shortName: "Make.com",
    category: "automations",
    icon: "/static/symbols/integrations/make.svg",
    guideKey: "make.com",
    // User will share the final URL later; keep centralized for easy update.
    externalUrl: "https://www.make.com/",
    setupTime: "10 min",
  },
  { id: "otherAutomations", name: "Other", category: "automations" },
  // Forms
  {
    id: "tally",
    name: "Tally.so",
    shortName: "Tally",
    category: "forms",
    icon: Tally,
    guides: [
      {
        title: "Read guide",
        href: "https://pimms.io/guides/tally-direct-webhook-integration",
      },
      {
        title: "Zapier setup",
        href: "https://pimms.io/guides/how-to-track-tally-form-submissions-marketing-attribution",
      },
    ],
  },
  {
    id: "brevoForm",
    name: "Brevo Forms",
    shortName: "Brevo",
    category: "forms",
    icon: Brevo,
    guideKey: "brevo",
    guideUrl: "https://pimms.io/guides/how-to-track-brevo-forms-and-meetings-webhook-integration",
  },
  {
    id: "systemeioForm",
    name: "Systeme.io",
    category: "forms",
    icon: SystemeIO,
    guideKey: "systeme.io",
  },
  {
    id: "typeform",
    name: "Typeform",
    category: "forms",
    icon: "/static/symbols/integrations/typeform.svg",
    guideKey: "typeform",
  },
  { id: "otherForms", name: "Other", category: "forms" },
  // APIs
  {
    id: "trackLeadApi",
    name: "Track Contact API",
    category: "apis",
    guideKey: "step-by-step-guide-for-developers-to-set-conversion-tracking",
    thumbnail: "https://assets.pimms.io/javascript-guide-pimms.webp",
    guideUrl:
      "https://pimms.io/guides/step-by-step-guide-for-developers-to-set-conversion-tracking",
  },
  {
    id: "trackSaleApi",
    name: "Track Sale API",
    category: "apis",
    guideKey: "step-by-step-guide-for-developers-to-set-conversion-tracking",
    thumbnail: "https://assets.pimms.io/javascript-guide-pimms.webp",
    guideUrl:
      "https://pimms.io/guides/step-by-step-guide-for-developers-to-set-conversion-tracking",
  },
  { id: "otherApis", name: "Other", category: "apis" },
];

export { PROVIDERS };

export function getConversionProviderDisplayName(providerId: string): string | null {
  const p = PROVIDERS.find((x) => x.id === providerId);
  if (!p) return null;
  return p.shortName || p.name;
}

function isProviderId(value: string): value is ProviderId {
  return PROVIDERS.some((p) => p.id === value);
}

const CATEGORY_CARDS: Array<{
  id: SetupCategory;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
  time?: string;
}> = [
    {
      id: "leadMagnet",
      title: "Via link with Magnet",
      subtitle: "Capture email as soon as users click.",
      icon: Magnet,
      time: "< 1 min",
    },
    {
      id: "thankyou",
      title: "Via thank you page",
      subtitle: "Webhook + redirect to match conversions.",
      icon: BadgeCheck,
      time: "10 min",
    },
    {
      id: "website",
      title: "Website",
      subtitle: "Framer, Webflow, WordPress…",
      icon: Globe,
      time: "20 min",
    },
    {
      id: "forms",
      title: "Forms",
      subtitle: "Brevo, Tally, Typeform…",
      icon: FileText,
      time: "10 min",
    },
    {
      id: "calendars",
      title: "Calendars",
      subtitle: "Cal.com, Calendly…",
      icon: Calendar,
      time: "10 min",
    },
    {
      id: "payments",
      title: "Payments",
      subtitle: "Stripe, Podia, Systeme.io…",
      icon: CreditCard,
      time: "10 min",
    },
    {
      id: "automations",
      title: "Automations",
      subtitle: "Zapier, Make.com…",
      icon: Workflow,
      time: "30 min",
    },
    {
      id: "apis",
      title: "Dev / API",
      subtitle: "Track leads/sales from code",
      icon: Code2,
      time: "30 min",
    },
  ];

export { CATEGORY_CARDS };

type GuidesApiResponse =
  | {
    ok: true;
    guides: Array<{
      title: string;
      href: string;
      date?: string | null;
      thumbnail?: string | null;
    }>;
  }
  | { ok: false; error: string; guides: [] };

function findGuide(
  guides: GuidesApiResponse["ok"] extends true ? any : any,
  key: string,
) {
  const k = key.toLowerCase();
  const list = Array.isArray(guides) ? guides : [];
  return (
    list.find(
      (g: any) =>
        String(g.title || "")
          .toLowerCase()
          .includes(k) ||
        String(g.href || "")
          .toLowerCase()
          .includes(k),
    ) || null
  );
}

function ConversionOnboardingModal({
  showConversionOnboardingModal,
  setShowConversionOnboardingModal,
  initialProviderId,
}: {
  showConversionOnboardingModal: boolean;
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
  initialProviderId?: string | null;
}) {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    if (!showConversionOnboardingModal) return;
    document.documentElement.setAttribute("data-onboarding-blur", "true");
    return () => {
      document.documentElement.removeAttribute("data-onboarding-blur");
    };
  }, [showConversionOnboardingModal]);

  return (
    <Modal
      showModal={showConversionOnboardingModal}
      setShowModal={setShowConversionOnboardingModal}
      className={cn(
        "max-h-[calc(100dvh-80px)] max-w-[96vw]",
        wide ? "sm:max-w-4xl lg:max-w-5xl" : "sm:max-w-2xl",
      )}
      overlayClassName="onboarding-glass-overlay"
    >
      <ConversionOnboardingModalInner
        setShowConversionOnboardingModal={setShowConversionOnboardingModal}
        initialProviderId={initialProviderId ?? null}
        onWideChange={setWide}
      />
    </Modal>
  );
}

function ConversionOnboardingModalInner({
  setShowConversionOnboardingModal,
  initialProviderId,
  onWideChange,
}: {
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
  initialProviderId: string | null;
  onWideChange?: (wide: boolean) => void;
}) {
  const { slug } = useWorkspace();

  const [providerId, setProviderId] = useState<ProviderId | null>(null);
  const [closeDisabled, setCloseDisabled] = useState(false);

  const { data: guidesResponse } = useSWR<GuidesApiResponse>(
    "/api/pimms/guides",
    fetcher,
    { revalidateOnFocus: false },
  );
  const guides = useMemo(
    () => (guidesResponse?.ok ? guidesResponse.guides : []),
    [guidesResponse],
  );

  const provider = useMemo(() => {
    if (!providerId) return null;
    const base = PROVIDERS.find((p) => p.id === providerId) ?? null;
    if (!base) return null;
    if (base.id.startsWith("other")) return base;
    if (base.guides && base.guides.length > 0) {
      return {
        ...base,
        guides: base.guides.map((g) => {
          const found = guides.find(
            (x) =>
              String(x.href || "").trim() === String(g.href || "").trim() ||
              String(x.href || "").includes(String(g.href || "")) ||
              String(g.href || "").includes(String(x.href || "")),
          );
          return { ...g, thumbnail: found?.thumbnail ?? null };
        }),
      } as Provider;
    }
    if (!base.guideKey) return base;
    const g = findGuide(guides, base.guideKey);
    return {
      ...base,
      ...(g?.href && { guideUrl: g.href }),
      ...(g?.thumbnail && { thumbnail: g.thumbnail }),
      ...(g?.title && base.shortName && { name: base.name }),
    } as Provider;
  }, [providerId, guides]);

  // Deep-link into a provider setup (ctProvider).
  useEffect(() => {
    if (!initialProviderId) {
      setProviderId(null);
      return;
    }
    if (!isProviderId(initialProviderId)) {
      setProviderId(null);
      return;
    }
    setProviderId(initialProviderId);
  }, [initialProviderId]);

  useEffect(() => {
    // Wide only when viewing a specific provider setup wizard.
    onWideChange?.(providerId != null);
  }, [onWideChange, providerId]);

  return (
    <AnimatedSizeContainer
      height
      transition={{ duration: 0.12, ease: "easeInOut" }}
    >
      <div className="relative max-h-[calc(100dvh-120px)] overflow-y-auto p-4 pr-16 sm:max-h-[calc(100dvh-140px)] sm:p-8 sm:pr-20 dub-scrollbar">
        {closeDisabled ? (
          <div className="absolute top-5 right-16 z-20 flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </div>
        ) : null}
        <button
          type="button"
          disabled={closeDisabled}
          onClick={() => setShowConversionOnboardingModal(false)}
          className={cn(
            "group absolute top-4 right-4 z-20 rounded-full p-2 text-neutral-500 transition-all duration-75 hover:bg-neutral-100 focus:outline-none active:bg-neutral-200",
            closeDisabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
          )}
        >
          <X className="size-5" />
        </button>

        <ProviderAction
          provider={provider}
          workspaceSlug={slug || null}
          onSelectProvider={(id) => setProviderId(id)}
          onCloseDisabledChange={setCloseDisabled}
        />
      </div>
    </AnimatedSizeContainer>
  );
}

function ProviderAction({
  provider,
  workspaceSlug,
  onSelectProvider,
  onCloseDisabledChange,
}: {
  provider: Provider | null;
  workspaceSlug: string | null;
  onSelectProvider: (providerId: ProviderId) => void;
  onCloseDisabledChange?: (disabled: boolean) => void;
}) {
  if (!provider) {
    return (
      <SetupTrackingList
        onSelectProvider={onSelectProvider}
        onCloseDisabledChange={onCloseDisabledChange}
      />
    );
  }

  if (provider.id.startsWith("other")) {
    return <OtherSetupForm provider={provider} workspaceSlug={workspaceSlug} />;
  }

  if (provider.id === "calDotCom") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <CalcomOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }
  if (provider.id === "calendly") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <CalendlyOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }
  if (provider.id === "stripe") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    const setupGuideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    const checkoutGuideThumbnail =
      (provider.guides && provider.guides.length > 1
        ? provider.guides[1]?.thumbnail
        : provider.thumbnail) ?? null;
    const setupGuideHref =
      provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.href
        : provider.guideUrl;
    const checkoutGuideHref =
      provider.guides && provider.guides.length > 1
        ? provider.guides[1]?.href
        : provider.guides && provider.guides.length > 0
          ? provider.guides[0]?.href
          : provider.guideUrl;

    if (!setupGuideHref || !checkoutGuideHref) {
      // Shouldn't happen because Stripe provider defines guides, but keep a safe fallback.
      return (
        <div className="py-8 text-sm text-neutral-600">
          Missing Stripe guide configuration.
        </div>
      );
    }

    return (
      <StripeOnboardingWizard
        guideThumbnail={guideThumbnail}
        setupGuideThumbnail={setupGuideThumbnail}
        checkoutGuideThumbnail={checkoutGuideThumbnail}
        setupGuideHref={setupGuideHref}
        checkoutGuideHref={checkoutGuideHref}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "brevoForm" || provider.id === "brevoMeeting") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <BrevoOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "wordpressElementor") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <ElementorOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "framer") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <FramerOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "webflow") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <WebflowOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }

  if (
    provider.id === "systemeio" ||
    provider.id === "systemeioForm" ||
    provider.id === "systemeioWebsite"
  ) {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    const guideHref =
      provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.href
        : provider.guideUrl;
    return (
      <SystemeioOnboardingWizard
        guideThumbnail={guideThumbnail}
        guideHref={guideHref ?? undefined}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "tally") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <TallyOnboardingWizard
        guideThumbnail={guideThumbnail}
        providerId={provider.id}
      />
    );
  }

  if (provider.id === "podia" || provider.id === "podiaWebsite") {
    const guideThumbnail =
      (provider.guides && provider.guides.length > 0
        ? provider.guides[0]?.thumbnail
        : provider.thumbnail) ?? null;
    return (
      <PodiaOnboardingWizard
        guideThumbnail={guideThumbnail}
        onContinueToStripe={() => onSelectProvider("stripe")}
        providerId={provider.id}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900">
          {provider.icon ? (
            typeof provider.icon === "string" ? (
              <img
                alt=""
                src={provider.icon}
                className="h-6 w-6 object-contain"
                loading="lazy"
              />
            ) : (
              <provider.icon className="size-6" />
            )
          ) : (
            <BookOpen className="size-4" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {provider.name}
          </h3>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(provider.guides && provider.guides.length > 0
          ? provider.guides
          : provider.guideUrl
            ? [
                {
                  title: "Read guide",
                  href: provider.guideUrl,
                  thumbnail: provider.thumbnail ?? null,
                },
              ]
            : []
        ).map((g) => (
          <Link
            key={g.href}
            href={g.href}
            target="_blank"
            className="group flex flex-col items-center rounded bg-neutral-200/40 pt-6 pb-4 transition-colors duration-100 hover:bg-neutral-200/60"
          >
            <div className="flex w-full justify-center px-6">
              {g.thumbnail ? (
                <BlurImage
                  src={g.thumbnail}
                  alt={`${provider.name} guide thumbnail`}
                  className="aspect-1200/630 w-full max-w-[260px] rounded bg-neutral-800 object-cover"
                  width={1200}
                  height={630}
                />
              ) : (
                <div className="aspect-video w-full max-w-[260px] rounded bg-neutral-200" />
              )}
            </div>
            <span className="mt-4 flex items-center gap-2 px-2 text-left text-[0.8125rem] font-medium text-neutral-800">
              <BookOpen className="size-4" />
              {g.title}
            </span>
          </Link>
        ))}

        {provider.externalUrl ? (
          <Link
            href={provider.externalUrl}
            target="_blank"
            className="group flex flex-col items-center justify-center rounded bg-neutral-200/40 px-6 py-6 text-center transition-colors duration-100 hover:bg-neutral-200/60"
          >
            <div className="flex size-12 items-center justify-center rounded-md bg-white/70 text-neutral-800">
              <BookOpen className="size-5" />
            </div>
            <div className="mt-3 text-sm font-semibold text-neutral-900">
              Open {provider.name}
            </div>
            <div className="mt-1 text-xs text-neutral-600">
              Connect via {provider.name} and start tracking.
            </div>
          </Link>
        ) : null}

        {provider.category === "apis" ? (
          <div className="group flex flex-col items-center justify-center rounded bg-neutral-200/40 px-6 py-6 text-center transition-colors duration-100 hover:bg-neutral-200/60">
            <div className="flex size-12 items-center justify-center rounded-md bg-white/70 text-neutral-800">
              <Code2 className="size-5" />
            </div>
            <div className="mt-3 text-sm font-semibold text-neutral-900">
              API documentation
            </div>
            <div className="mt-1 text-xs text-neutral-600">
              Endpoints, payloads, and examples.
            </div>
            <Link
              href="https://pim.ms/api"
              target="_blank"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
            >
              Open API docs
            </Link>
          </div>
        ) : null}

      </div>

    </div>
  );
}

function SetupTrackingList({
  onSelectProvider,
  onCloseDisabledChange,
}: {
  onSelectProvider: (providerId: ProviderId) => void;
  onCloseDisabledChange?: (disabled: boolean) => void;
}) {
  const { completedProviderIds } = useOnboardingPreferences();

  const [view, setView] = useState<"list" | "support">("list");

  useEffect(() => {
    onCloseDisabledChange?.(false);
  }, [onCloseDisabledChange]);

  const setupItems = useMemo(() => {
    const filtered = PROVIDERS.filter(
      (p) =>
        p.id !== "leadMagnet" &&
        p.id !== "thankyou" &&
        !EXCLUDED_PROVIDER_IDS.has(p.id),
    );
    // Deduplicate by canonical ID (e.g. podiaWebsite + podia both → one "Podia" entry).
    // Prefer the provider whose id matches the canonical ID when multiple exist.
    const byCanonical = new Map<string, typeof filtered[0]>();
    for (const p of filtered) {
      const canonical = canonicalizeProviderId(p.id);
      const existing = byCanonical.get(canonical);
      if (!existing || p.id === canonical) {
        byCanonical.set(canonical, p);
      }
    }
    return Array.from(byCanonical.values());
  }, []);

  if (view === "support") {
    return (
      <>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              Contact support
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Tell us what you want to track.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Back
          </button>
        </div>

        <CustomSetupSupportContent
          onClose={() => setView("list")}
          closeLabel="Back"
          showHeader={false}
          showClose={false}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-neutral-900">
            Setup tracking
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Choose one setup and follow the steps.
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mt-3 grid gap-2">
          {setupItems
            .filter((p) => !String(p.id).startsWith("other"))
            .map((p) => {
              const checked = isProviderCompleted(p.id, completedProviderIds);
              const showStatus = p.category !== "automations" && p.category !== "apis";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProvider(p.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left hover:bg-neutral-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900">
                      {p.icon ? (
                        typeof p.icon === "string" ? (
                          <img
                            alt=""
                            src={p.icon}
                            className="h-5 w-5 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <p.icon className="size-5" />
                        )
                      ) : (
                        <BookOpen className="size-4 text-neutral-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-900">
                        Setup tracking for {p.name}
                      </div>
                    </div>
                  </div>

                  {showStatus && checked ? (
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Done
                    </span>
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-neutral-400" />
                  )}
                </button>
              );
            })}

          <button
            type="button"
            onClick={() => setView("support")}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left hover:bg-neutral-50"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
              Contact support
              </div>
              <div className="mt-0.5 text-xs text-neutral-600">
              Custom setup help.
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-neutral-400" />
          </button>
        </div>
      </div>
    </>
  );
}

function FeedbackForm({
  providerName,
  category,
  workspaceSlug,
  defaultPlaceholder,
  subject,
}: {
  providerName: string;
  category: SetupCategory;
  workspaceSlug: string | null;
  defaultPlaceholder: string;
  subject: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <textarea
        className="block w-full resize-none rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:ring-0 focus:outline-none"
        rows={5}
        placeholder={defaultPlaceholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={sending || sent || message.trim().length === 0}
          className={cn(
            "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800",
            (sending || sent || message.trim().length === 0) &&
            "cursor-not-allowed opacity-60",
          )}
          onClick={async () => {
            setSending(true);
            try {
              await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: [
                    subject,
                    `Provider: ${providerName}`,
                    `Category: ${category}`,
                    `Workspace: ${workspaceSlug || "unknown"}`,
                    "",
                    message.trim(),
                  ].join("\n"),
                  attachmentIds: [],
                }),
              });
              setSent(true);
            } finally {
              setSending(false);
            }
          }}
        >
          {sent ? "Sent" : sending ? "Sending…" : "Send to support"}
        </button>
      </div>
    </div>
  );
}

function OtherSetupForm({
  provider,
  workspaceSlug,
}: {
  provider: Provider;
  workspaceSlug: string | null;
}) {
  return (
    <FeedbackForm
      providerName={provider.name}
      category={provider.category}
      workspaceSlug={workspaceSlug}
      defaultPlaceholder={getFeedbackPlaceholder(
        provider.category,
        "your setup",
      )}
      subject="Conversion setup feedback (Other)"
    />
  );
}

function getFeedbackPlaceholder(category: SetupCategory, providerName: string) {
  if (category === "payments") {
    return `Example: I use ${providerName}. I want to track payments and attribute them to Pimms clicks. What should I track and where do I paste the setup?`;
  }
  if (category === "automations") {
    return `Example: I want to connect ${providerName} with Pimms to sync leads to my CRM. Which trigger/action should I use?`;
  }
  if (category === "calendars") {
    return `Example: I use ${providerName}. What event should I track when someone books a meeting?`;
  }
  if (category === "forms") {
    return `Example: I use ${providerName}. I want to track form submissions as leads.`;
  }
  if (category === "website") {
    return `Example: My site is on ${providerName}. Where do I paste the code / what event do I track?`;
  }
  if (category === "apis") {
    return `Example: I want to track server-side conversions from ${providerName}. What endpoint + payload should I send?`;
  }
  return "Tell us what you're trying to track.";
}

export function useConversionOnboardingModal() {
  const [showConversionOnboardingModal, setShowConversionOnboardingModal] =
    useState(false);
  const [initialProviderId, setInitialProviderId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const ctSetup = searchParams.get("ctSetup");
    if (ctSetup !== "1") return;

    const ctProvider = searchParams.get("ctProvider");
    setShowConversionOnboardingModal(true);
    setInitialProviderId(ctProvider);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ctSetup");
    params.delete("ctProvider");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const ConversionOnboardingModalComponent = useCallback(() => {
    return (
      <ConversionOnboardingModal
        showConversionOnboardingModal={showConversionOnboardingModal}
        setShowConversionOnboardingModal={setShowConversionOnboardingModal}
        initialProviderId={initialProviderId}
      />
    );
  }, [showConversionOnboardingModal, setShowConversionOnboardingModal, initialProviderId]);

  return useMemo(
    () => ({
      setShowConversionOnboardingModal,
      ConversionOnboardingModal: ConversionOnboardingModalComponent,
    }),
    [ConversionOnboardingModalComponent],
  );
}
