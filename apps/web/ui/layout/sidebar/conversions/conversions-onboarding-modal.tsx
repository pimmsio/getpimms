"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { X } from "@/ui/shared/icons";
import {
  AnimatedSizeContainer,
  BlurImage,
  BookOpen,
  CopyButton,
  Modal,
} from "@dub/ui";
import { cn, fetcher } from "@dub/utils";
import {
  Calendar,
  ChevronLeft,
  Code2,
  CreditCard,
  Globe,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";
import { Stripe } from "./icons/stripe";
import { SystemeIO } from "./icons/systemeio";

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
  | "wix"
  | "squarespace"
  | "shopify"
  | "carrd"
  | "calDotCom"
  | "calendly"
  | "iclosed"
  | "acuity"
  | "hubspotMeetings"
  | "stripe"
  | "systemeio"
  | "paypal"
  | "paddle"
  | "lemonsqueezy"
  | "shopifyPayments"
  | "zapier"
  | "make"
  | "n8n"
  | "pabbly"
  | "tally"
  | "typeform"
  | "jotform"
  | "googleForms"
  | "other_website"
  | "other_calendars"
  | "other_payments"
  | "other_automations"
  | "other_forms"
  | "other_apis"
  | "trackLeadApi"
  | "trackSaleApi";

type Provider = {
  id: ProviderId;
  name: string;
  shortName?: string;
  category: SetupCategory;
  icon?: any;
  guideKey?: string; // used to map to /api/pimms/guides
  guideUrl?: string;
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
    name: "Thank-you links",
    shortName: "Thank-you links",
    category: "thankyou",
    setupTime: "< 1 min",
  },
  // Website
  {
    id: "framer",
    name: "Framer",
    category: "website",
    guideKey: "framer",
    setupTime: "30 min",
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "website",
    guideKey: "webflow",
    setupTime: "30 min",
  },
  {
    id: "lovable",
    name: "Lovable",
    category: "website",
    guideKey: "lovable",
    setupTime: "30 min",
  },
  {
    id: "wordpressElementor",
    name: "WordPress / Elementor",
    category: "website",
    guideKey: "wordpress",
    setupTime: "30 min",
  },
  {
    id: "wix",
    name: "Wix",
    category: "website",
    guideKey: "wix",
    setupTime: "30 min",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    category: "website",
    guideKey: "squarespace",
    setupTime: "30 min",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "website",
    guideKey: "shopify",
    setupTime: "30 min",
  },
  {
    id: "carrd",
    name: "Carrd",
    category: "website",
    guideKey: "carrd",
    setupTime: "30 min",
  },
  { id: "other_website", name: "Other", category: "website" },
  // Calendars
  {
    id: "calDotCom",
    name: "Cal.com",
    category: "calendars",
    guideKey: "cal.com",
    setupTime: "5 min",
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "calendars",
    guideKey: "calendly",
    setupTime: "5 min",
  },
  {
    id: "iclosed",
    name: "iclosed.io",
    shortName: "iclosed",
    category: "calendars",
    guideKey: "iclosed",
    setupTime: "5 min",
  },
  {
    id: "acuity",
    name: "Acuity Scheduling",
    shortName: "Acuity",
    category: "calendars",
    guideKey: "acuity",
    setupTime: "5 min",
  },
  {
    id: "hubspotMeetings",
    name: "HubSpot Meetings",
    shortName: "HubSpot",
    category: "calendars",
    guideKey: "hubspot",
    setupTime: "5 min",
  },
  { id: "other_calendars", name: "Other", category: "calendars" },
  // Payments
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    icon: Stripe,
    guideKey: "stripe",
  },
  {
    id: "systemeio",
    name: "Systeme.io",
    category: "payments",
    icon: SystemeIO,
    guideKey: "systeme.io",
  },
  {
    id: "paypal",
    name: "PayPal",
    category: "payments",
    guideKey: "paypal",
  },
  {
    id: "paddle",
    name: "Paddle",
    category: "payments",
    guideKey: "paddle",
  },
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    shortName: "LemonSqueezy",
    category: "payments",
    guideKey: "lemon squeezy",
  },
  {
    id: "shopifyPayments",
    name: "Shopify Payments",
    shortName: "Shopify",
    category: "payments",
    guideKey: "shopify",
  },
  { id: "other_payments", name: "Other", category: "payments" },
  // Automations
  {
    id: "zapier",
    name: "Zapier",
    category: "automations",
    guideKey: "zapier",
    externalUrl: "https://zapier.com/apps/pimms/integrations",
    setupTime: "10 min",
  },
  {
    id: "make",
    name: "Make.com",
    shortName: "Make.com",
    category: "automations",
    guideKey: "make.com",
    // User will share the final URL later; keep centralized for easy update.
    externalUrl: "https://www.make.com/",
    setupTime: "10 min",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automations",
    guideKey: "n8n",
    externalUrl: "https://n8n.io/",
    setupTime: "10 min",
  },
  {
    id: "pabbly",
    name: "Pabbly Connect",
    shortName: "Pabbly",
    category: "automations",
    guideKey: "pabbly",
    externalUrl: "https://www.pabbly.com/connect/",
    setupTime: "10 min",
  },
  { id: "other_automations", name: "Other", category: "automations" },
  // Forms
  {
    id: "tally",
    name: "Tally.so",
    shortName: "Tally",
    category: "forms",
    guideKey: "tally",
  },
  {
    id: "typeform",
    name: "Typeform",
    category: "forms",
    guideKey: "typeform",
  },
  {
    id: "jotform",
    name: "Jotform",
    category: "forms",
    guideKey: "jotform",
  },
  {
    id: "googleForms",
    name: "Google Forms",
    shortName: "Google",
    category: "forms",
    guideKey: "google forms",
  },
  { id: "other_forms", name: "Other", category: "forms" },
  // APIs
  {
    id: "trackLeadApi",
    name: "Track Lead API",
    category: "apis",
  },
  {
    id: "trackSaleApi",
    name: "Track Sale API",
    category: "apis",
  },
  { id: "other_apis", name: "Other", category: "apis" },
];

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
    title: "Create link magnets",
    subtitle: "Get started fast in under a minute.",
    icon: Sparkles,
    time: "< 1 min",
  },
  {
    id: "thankyou",
    title: "Thank-you links",
    subtitle: "Attribute conversions even when webhooks miss pimms_id.",
    icon: Sparkles,
    time: "< 1 min",
  },
  {
    id: "website",
    title: "Website",
    subtitle: "Framer, Webflow, WordPress…",
    icon: Globe,
    time: "30 min",
  },
  {
    id: "calendars",
    title: "Calendars",
    subtitle: "Cal.com, Calendly, Acuity…",
    icon: Calendar,
    time: "5 min",
  },
  {
    id: "payments",
    title: "Payments",
    subtitle: "Stripe, PayPal, Paddle…",
    icon: CreditCard,
    time: "5 min",
  },
  {
    id: "automations",
    title: "Automations",
    subtitle: "Zapier, Make.com, n8n…",
    icon: Sparkles,
    time: "10 min",
  },
  {
    id: "forms",
    title: "Forms",
    subtitle: "Tally, Typeform and more…",
    icon: Globe,
    time: "10 min",
  },
  {
    id: "apis",
    title: "APIs",
    subtitle: "Track leads/sales from code",
    icon: Code2,
  },
];

type WizardStep = "chooseCategory" | "chooseProvider" | "providerAction";

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
}: {
  showConversionOnboardingModal: boolean;
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
}) {
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
      className="max-h-[calc(100dvh-100px)] max-w-2xl"
      overlayClassName="onboarding-glass-overlay"
    >
      <ConversionOnboardingModalInner
        setShowConversionOnboardingModal={setShowConversionOnboardingModal}
      />
    </Modal>
  );
}

function ConversionOnboardingModalInner({
  setShowConversionOnboardingModal,
}: {
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slug } = useWorkspace();

  const [step, setStep] = useState<WizardStep>("chooseCategory");
  const [category, setCategory] = useState<SetupCategory | null>(null);
  const [providerId, setProviderId] = useState<ProviderId | null>(null);

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
    if (base.id.startsWith("other_")) return base;
    if (!base.guideKey) return base;
    const g = findGuide(guides, base.guideKey);
    return {
      ...base,
      ...(g?.href && { guideUrl: g.href }),
      ...(g?.thumbnail && { thumbnail: g.thumbnail }),
      ...(g?.title && base.shortName && { name: base.name }),
    } as Provider;
  }, [providerId, guides]);

  const providersForCategory = useMemo(() => {
    if (!category) return [];
    return PROVIDERS.filter(
      (p) =>
        p.category === category && !["leadMagnet", "thankyou"].includes(p.id),
    );
  }, [category]);

  const resetToRoot = () => {
    setStep("chooseCategory");
    setCategory(null);
    setProviderId(null);
  };

  const goBack = () => {
    if (step === "providerAction") {
      setStep(category === "leadMagnet" ? "chooseCategory" : "chooseProvider");
      if (category === "leadMagnet") setProviderId(null);
      return;
    }
    if (step === "chooseProvider") {
      resetToRoot();
      return;
    }
  };

  const handleChooseCategory = (next: SetupCategory) => {
    setCategory(next);
    if (next === "leadMagnet" || next === "thankyou") {
      setProviderId(next === "leadMagnet" ? "leadMagnet" : "thankyou");
      setStep("providerAction");
    } else {
      setStep("chooseProvider");
    }
  };

  const handleChooseProvider = (id: ProviderId) => {
    setProviderId(id);
    setStep("providerAction");
  };

  return (
    <AnimatedSizeContainer
      height
      transition={{ duration: 0.12, ease: "easeInOut" }}
    >
      <div className="p-4 sm:p-8">
        <button
          type="button"
          onClick={() => setShowConversionOnboardingModal(false)}
          className="group absolute top-4 right-4 z-[1] hidden rounded-full p-2 text-neutral-500 transition-all duration-75 hover:bg-neutral-100 focus:outline-none active:bg-neutral-200 md:block"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          {step !== "chooseCategory" ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          ) : null}
        </div>

        <ModalPage visible={step === "chooseCategory"}>
          <ChooseCategory onChoose={handleChooseCategory} />
        </ModalPage>

        <ModalPage visible={step === "chooseProvider"}>
          <ChooseProvider
            category={category}
            providers={providersForCategory}
            onChoose={handleChooseProvider}
          />
        </ModalPage>

        <ModalPage visible={step === "providerAction"}>
          <ProviderAction
            provider={provider}
            onReset={resetToRoot}
            workspaceSlug={slug || null}
            onCreateLeadMagnetLink={() => {
              // Open Link Builder in “new link” mode (ModalProvider watches ?newLink).
              // We also pass ?leadMagnet=1 to preconfigure the form.
              const params = new URLSearchParams(searchParams.toString());
              params.set("newLink", "true");
              params.set("leadMagnet", "1");
              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });
              setShowConversionOnboardingModal(false);
            }}
            onCreateThankYouLink={() => {
              // Open Link Builder in “new link” mode (ModalProvider watches ?newLink).
              // We also pass ?ty=1 to preconfigure the form for a conversion callback link.
              const params = new URLSearchParams(searchParams.toString());
              params.set("newLink", "true");
              params.set("ty", "1");
              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });
              setShowConversionOnboardingModal(false);
            }}
          />
        </ModalPage>
      </div>
    </AnimatedSizeContainer>
  );
}

function ModalPage({
  children,
  visible,
}: {
  children: ReactNode;
  visible: boolean;
}) {
  return visible ? <div className="animate-fade-in">{children}</div> : null;
}

function ChooseCategory({
  onChoose,
}: {
  onChoose: (category: SetupCategory) => void;
}) {
  return (
    <div>
      <h3 className="mt-2 text-lg font-semibold text-neutral-900">
        Start tracking beyond clicks
      </h3>
      <p className="mt-2 text-sm text-neutral-600">Choose your setup path.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORY_CARDS.map(
          ({ id, title, subtitle, icon: Icon, badge, time }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "group relative flex items-start gap-3 rounded-lg bg-neutral-200/40 p-4 text-left transition-colors hover:bg-neutral-200/60",
                id === "leadMagnet" &&
                  "bg-neutral-900/5 ring-1 ring-neutral-900/10 hover:bg-neutral-900/10",
              )}
              onClick={() => onChoose(id)}
            >
              {time ? (
                <span className="absolute top-3 right-3 inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                  {time}
                </span>
              ) : null}
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/70 text-neutral-800">
                <Icon className="size-4" />
              </div>
              <div className={cn("min-w-0", time && "pr-16")}>
                <div className="text-sm font-semibold text-neutral-900">
                  {title}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-neutral-600">
                  {subtitle}
                </div>
                {badge ? (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {badge}
                  </div>
                ) : null}
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function ChooseProvider({
  category,
  providers,
  onChoose,
}: {
  category: SetupCategory | null;
  providers: Provider[];
  onChoose: (id: ProviderId) => void;
}) {
  const title =
    category === "website"
      ? "Choose your website builder"
      : category === "calendars"
        ? "Choose your calendar"
        : category === "payments"
          ? "Choose your payment setup"
          : category === "automations"
            ? "Choose your automation platform"
            : category === "forms"
              ? "Choose your form provider"
              : category === "apis"
                ? "Choose your API path"
                : "Choose a provider";

  return (
    <div>
      <h3 className="mt-2 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">
        Pick the closest match. You can always switch later.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {providers.map(({ id, name, shortName, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="group flex flex-col items-center rounded bg-neutral-200/40 p-6 pb-4 transition-colors duration-100 hover:bg-neutral-200/60"
            onClick={() => onChoose(id)}
          >
            <div className="flex size-10 items-center justify-center rounded-md bg-white/70 text-neutral-800">
              {Icon ? (
                <Icon className="h-6" />
              ) : (
                <BookOpen className="size-4" />
              )}
            </div>
            <span className="mt-3 text-center text-sm font-medium text-neutral-800">
              {shortName || name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProviderAction({
  provider,
  onReset,
  onCreateLeadMagnetLink,
  onCreateThankYouLink,
  workspaceSlug,
}: {
  provider: Provider | null;
  onReset: () => void;
  onCreateLeadMagnetLink: () => void;
  onCreateThankYouLink: () => void;
  workspaceSlug: string | null;
}) {
  if (!provider) {
    return (
      <div className="py-12 text-center text-sm text-neutral-600">
        Please select a setup option.
      </div>
    );
  }

  if (provider.id === "leadMagnet") {
    return (
      <div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-neutral-900">
            Create link magnets
          </h3>
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
            &lt; 1 min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Most popular
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Get started in less than a minute with link magnets that capture email
          before reaching your destination URL.
        </p>

        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
                Create your first link magnet
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                We’ll add an email capture step before redirecting. Great for
                lead gen, gated content, and opt-ins.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
              &lt; 1 min
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              onClick={onCreateLeadMagnetLink}
            >
              Create link magnet
            </button>
            <div className="text-xs text-neutral-500">
              You can customize the capture step anytime.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (provider.id === "thankyou") {
    return (
      <div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-neutral-900">
            Thank-you links
          </h3>
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
            &lt; 1 min
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Create a short link used as a conversion callback (thank-you page).
          TY hits don’t count as clicks, but they help reconcile provider webhooks
          that sometimes miss <code className="rounded bg-neutral-100 px-1">pimms_id</code>.
        </p>

        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
                Create your first thank-you link
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                Use a custom key like <code>/abc/thankyou</code> and set the
                destination URL to your final thank-you page.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
              &lt; 1 min
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              onClick={onCreateThankYouLink}
            >
              Create thank-you link
            </button>
            <div className="text-xs text-neutral-500">
              You can update it anytime.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (provider.id.startsWith("other_")) {
    return <OtherSetupForm provider={provider} workspaceSlug={workspaceSlug} />;
  }

  const apiSnippetLead = `fetch("https://app.pimms.io/api/track/lead", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer pimms_...",
  },
  body: JSON.stringify({
    clickId: "CLICK_ID",
    eventName: "signup",
    externalId: "user_123",
    customerEmail: "user@example.com",
  }),
});`;

  const apiSnippetSale = `fetch("https://app.pimms.io/api/track/sale", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer pimms_...",
  },
  body: JSON.stringify({
    clickId: "CLICK_ID",
    amount: 4900,
    currency: "usd",
    paymentProcessor: "stripe",
  }),
});`;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900">
          {provider.icon ? (
            <provider.icon className="size-6" />
          ) : (
            <BookOpen className="size-4" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {provider.name}
          </h3>
          <p className="text-sm text-neutral-600">
            Follow the guide or copy a snippet.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {provider.guideUrl ? (
          <Link
            href={provider.guideUrl}
            target="_blank"
            className="group flex flex-col items-center rounded bg-neutral-200/40 pt-6 pb-4 transition-colors duration-100 hover:bg-neutral-200/60"
          >
            <div className="flex w-full justify-center px-6">
              {provider.thumbnail ? (
                <BlurImage
                  src={provider.thumbnail}
                  alt={`${provider.name} guide thumbnail`}
                  className="aspect-[1200/630] w-full max-w-[260px] rounded bg-neutral-800 object-cover"
                  width={1200}
                  height={630}
                />
              ) : (
                <div className="aspect-video w-full max-w-[260px] rounded bg-neutral-200" />
              )}
            </div>
            <span className="mt-4 flex items-center gap-2 px-2 text-left text-[0.8125rem] font-medium text-neutral-800">
              <BookOpen className="size-4" />
              Read guide
            </span>
          </Link>
        ) : null}

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
          <div className="rounded bg-neutral-50 p-4 ring-1 ring-neutral-200/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-neutral-900">
                {provider.id === "trackSaleApi" ? "Track sale" : "Track lead"}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="https://pim.ms/api"
                  target="_blank"
                  className="text-xs text-neutral-600 underline-offset-4 hover:underline"
                >
                  pim.ms/api
                </Link>
                <CopyButton
                  value={
                    provider.id === "trackSaleApi"
                      ? apiSnippetSale
                      : apiSnippetLead
                  }
                  className="rounded"
                />
              </div>
            </div>
            <pre className="mt-3 overflow-auto rounded bg-white p-3 text-xs text-neutral-800 ring-1 ring-neutral-200/60">
              <code>
                {provider.id === "trackSaleApi"
                  ? apiSnippetSale
                  : apiSnippetLead}
              </code>
            </pre>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <FeedbackForm
          providerName={provider.name}
          category={provider.category}
          workspaceSlug={workspaceSlug}
          defaultPlaceholder={getFeedbackPlaceholder(
            provider.category,
            provider.name,
          )}
          subject="Conversion setup feedback"
        />
      </div>
    </div>
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

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const ctSetup = searchParams.get("ctSetup");
    if (ctSetup !== "1") return;

    setShowConversionOnboardingModal(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ctSetup");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const ConversionOnboardingModalComponent = useCallback(() => {
    return (
      <ConversionOnboardingModal
        showConversionOnboardingModal={showConversionOnboardingModal}
        setShowConversionOnboardingModal={setShowConversionOnboardingModal}
      />
    );
  }, [showConversionOnboardingModal, setShowConversionOnboardingModal]);

  return useMemo(
    () => ({
      setShowConversionOnboardingModal,
      ConversionOnboardingModal: ConversionOnboardingModalComponent,
    }),
    [ConversionOnboardingModalComponent],
  );
}
