"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { X } from "@/ui/shared/icons";
import {
  AnimatedSizeContainer,
  BlurImage,
  BookOpen,
  Modal,
} from "@dub/ui";
import { cn, fetcher, nanoid } from "@dub/utils";
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  Code2,
  CreditCard,
  FileText,
  Globe,
  Magnet,
  Workflow,
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
import { Brevo } from "./icons/brevo";
import { Stripe } from "./icons/stripe";
import { SystemeIO } from "./icons/systemeio";
import { Tally } from "./icons/tally";

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
  | "stripe"
  | "systemeio"
  | "shopifyPayments"
  | "podia"
  | "podiaWebsite"
  | "zapier"
  | "make"
  | "n8n"
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
  thumbnail?: string;
  externalUrl?: string; // direct integration page (e.g., Zapier)
  setupTime?: string; // human-friendly estimate, e.g. "< 1 min", "10 min"
  isMostPopular?: boolean;
};

const THANK_YOU_ALT_PROVIDER_IDS: ProviderId[] = [
  "brevoMeeting",
  "brevoForm",
  "stripe",
  "calendly",
  "lemcal",
  "calDotCom",
  "hubspotMeetings",
  "tally",
  "podia",
];

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
    guideKey: "framer",
    setupTime: "30 min",
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "website",
    icon: "/static/symbols/integrations/webflow.svg",
    guideKey: "webflow",
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
    guideKey: "podia",
    setupTime: "30 min",
  },
  { id: "otherWebsite", name: "Other", category: "website" },
  // Calendars
  {
    id: "calDotCom",
    name: "Cal.com",
    category: "calendars",
    icon: "/static/symbols/integrations/calcom.svg",
    guideKey: "cal.com",
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
  { id: "otherCalendars", name: "Other", category: "calendars" },
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
    guideKey: "podia",
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
  {
    id: "n8n",
    name: "n8n",
    category: "automations",
    icon: "/static/symbols/integrations/n8n.svg",
    guideKey: "n8n",
    externalUrl: "https://n8n.io/",
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
    guideKey: "tally",
    guideUrl: "https://pimms.io/guides/tally-direct-webhook-integration",
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
    name: "Track Lead API",
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
      subtitle: "Zapier, Make.com, n8n…",
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
    if (base.id.startsWith("other")) return base;
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
      if (category === "leadMagnet" || category === "thankyou") {
        resetToRoot();
      } else {
        setStep("chooseProvider");
      }
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
          className="group absolute top-4 right-4 z-1 hidden rounded-full p-2 text-neutral-500 transition-all duration-75 hover:bg-neutral-100 focus:outline-none active:bg-neutral-200 md:block"
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
              const nextTyKey = `${nanoid(8)}/thankyou`;
              params.set("tyKey", nextTyKey);
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
                typeof Icon === "string" ? (
                  <img
                    alt=""
                    src={Icon}
                    className="h-6 w-6 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Icon className="h-6" />
                )
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
      <div className="flex flex-col items-start gap-4">
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-neutral-900">
            Via link with Magnet
          </h3>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Capture email as soon as users click, then redirect to your destination page.
        </p>
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          onClick={onCreateLeadMagnetLink}
        >
          Create link magnet
        </button>
      </div>
    );
  }

  if (provider.id === "thankyou") {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-neutral-900">
            Via thank you page
          </h3>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Webhook + thank-you redirect to match conversions. Use a custom key like <code>/abc/thankyou</code> and set the
          destination URL to your final thank-you page.
        </p>

        <button
          type="button"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          onClick={onCreateThankYouLink}
        >
          Create thank-you link
        </button>
      </div>
    );
  }

  if (provider.id.startsWith("other")) {
    return <OtherSetupForm provider={provider} workspaceSlug={workspaceSlug} />;
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
          <p className="text-sm text-neutral-600">
            Follow a guide or contact support
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

        {THANK_YOU_ALT_PROVIDER_IDS.includes(provider.id) && (
          <div className="flex flex-col items-center justify-center rounded bg-neutral-200/40 px-6 py-6 text-center">
            <div className="mt-3 text-sm font-semibold text-neutral-900">
              Alternative via thank-you page
            </div>
            <div className="mt-1 text-xs text-neutral-600">
              Redirect to a Pimms thank-you link after the conversion.
            </div>
            <button
              type="button"
              className="mt-4 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              onClick={onCreateThankYouLink}
            >
              Create thank-you link
            </button>
          </div>
        )}
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
