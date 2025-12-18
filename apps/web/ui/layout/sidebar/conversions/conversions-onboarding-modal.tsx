"use client";

import { X } from "@/ui/shared/icons";
import { ConversionTrackingToggleSwitch } from "@/ui/workspaces/conversion-tracking-toggle";
import {
  AnimatedSizeContainer,
  BlurImage,
  BookOpen,
  CircleDollar,
  Modal,
  SquareChart,
} from "@dub/ui";
import { cn } from "@dub/utils";
import Link from "next/link";
import {
  createContext,
  CSSProperties,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useId,
  useState,
} from "react";
import { Custom } from "./icons/custom";
import { Stripe } from "./icons/stripe";
import { SystemeIO } from "./icons/systemeio";

const PAYMENT_PROCESSORS = [
  {
    name: "Stripe",
    icon: Stripe,
    guide: "https://pimms.io/guides/how-to-track-stripe-sales-marketing-attribution",
    thumbnail: "https://assets.pimms.io/stripe-guide-pimms.webp",
  },
  // {
  //   name: "Shopify",
  //   icon: Shopify,
  //   guide: "https://dub.co/docs/conversions/sales/shopify",
  //   thumbnail: "https://assets.dub.co/help/conversions-guide-shopify.png",
  // },
  {
    name: "Systeme.io",
    icon: SystemeIO,
    guide: "https://pimms.io/guides/how-to-track-systemeio-sales-and-leads-marketing-attribution",
    thumbnail: "https://assets.pimms.io/systemeio-guide-pimms.webp",
  },
  {
    name: "Custom Payments",
    shortName: "Custom",
    icon: Custom,
    guide: "https://pimms.io/guides/introducing-pimms-conversion-tracking",
    thumbnail: "https://assets.pimms.io/conversion-tracking-1.png",
  },
];

const ConversionOnboardingModalContext = createContext<{
  paymentProcessorIndex: number | null;
  setPaymentProcessorIndex: Dispatch<SetStateAction<number | null>>;
}>({
  paymentProcessorIndex: null,
  setPaymentProcessorIndex: () => {},
});

function ConversionOnboardingModal({
  showConversionOnboardingModal,
  setShowConversionOnboardingModal,
}: {
  showConversionOnboardingModal: boolean;
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Modal
      showModal={showConversionOnboardingModal}
      setShowModal={setShowConversionOnboardingModal}
      className="max-h-[calc(100dvh-100px)] max-w-xl"
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
  const [paymentProcessorIndex, setPaymentProcessorIndex] = useState<
    number | null
  >(null);

  return (
    <AnimatedSizeContainer
      height
      transition={{ duration: 0.1, ease: "easeInOut" }}
    >
      <div className="p-4 sm:p-8">
        <button
          type="button"
          onClick={() => setShowConversionOnboardingModal(false)}
          className="group absolute right-4 top-4 z-[1] hidden rounded-full p-2 text-neutral-500 transition-all duration-75 hover:bg-neutral-100 focus:outline-none active:bg-neutral-200 md:block"
        >
          <X className="size-5" />
        </button>
        <ConversionOnboardingModalContext.Provider
          value={{
            paymentProcessorIndex,
            setPaymentProcessorIndex,
          }}
        >
          <ModalPage visible={paymentProcessorIndex === null}>
            <PaymentProcessorSelection />
          </ModalPage>
          <ModalPage
            visible={
              paymentProcessorIndex !== null
            }
          >
            <Docs />
          </ModalPage>
        </ConversionOnboardingModalContext.Provider>
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

function PaymentProcessorSelection() {
  const { setPaymentProcessorIndex } = useContext(
    ConversionOnboardingModalContext,
  );

  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-900">
        <CircleDollar className="size-8 [&_*]:stroke-1 [&_circle]:hidden" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-neutral-800">
        Set up sales tracking
      </h3>
      <p className="mt-2 text-base text-neutral-500">
        Select your payment processor to view our setup guides.
      </p>
      <div
        className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={
          {
            "--cols": PAYMENT_PROCESSORS.length,
          } as CSSProperties
        }
      >
        {PAYMENT_PROCESSORS.map(({ icon: Icon, name, shortName }, index) => (
          <button
            key={index}
            type="button"
            className="group flex flex-col items-center rounded bg-neutral-200/40 p-8 pb-6 transition-colors duration-100 hover:bg-neutral-200/60"
            onClick={() => {
              setPaymentProcessorIndex(index);
            }}
          >
            <Icon className="h-11 transition-transform duration-100 group-hover:-translate-y-0.5" />
            <span className="mt-3 text-center text-sm font-medium text-neutral-700 sm:mt-8">
              {shortName || name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Docs() {
  const id = useId();

  const {
    paymentProcessorIndex,
    setPaymentProcessorIndex,
  } = useContext(ConversionOnboardingModalContext);

  const paymentProcessor = PAYMENT_PROCESSORS[paymentProcessorIndex ?? 0];


  return (
    <div>
      <div className="flex grid-cols-2 gap-12 sm:grid sm:gap-4">
        <div>
          <div className="flex size-12 items-center justify-center rounded border border-neutral-200 text-neutral-900">
            <paymentProcessor.icon className="size-8" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-neutral-800">
            {paymentProcessor.name}
          </h3>
        </div>
      </div>
      <div
        className={cn(
          "mt-6 grid grid-cols-1 gap-4",
        )}
      >
        {[
          {
            label: `Read ${paymentProcessor.name} guide`,
            url: paymentProcessor.guide,
            thumbnail: paymentProcessor.thumbnail,
            icon: BookOpen,
          },
        ].map(({ icon: Icon, label, url, thumbnail }) => (
          <Link
            key={label}
            href={url || "https://dub.co/docs/conversions/quickstart"}
            target="_blank"
            className="group flex flex-col items-center rounded bg-neutral-200/40 pb-4 pt-6 transition-colors duration-100 hover:bg-neutral-200/60"
          >
            <div className="flex w-full justify-center px-6">
              {thumbnail ? (
                <BlurImage
                  src={thumbnail}
                  alt={`${label} thumbnail`}
                  className="aspect-[1200/630] w-full max-w-[240px] rounded bg-neutral-800 object-cover"
                  width={1200}
                  height={630}
                />
              ) : (
                <div className="aspect-video w-full rounded bg-neutral-200" />
              )}
            </div>
            <span className="mt-4 flex items-center gap-2 px-2 text-left text-[0.8125rem] font-medium text-neutral-700">
              <Icon className="size-4" />
              {label}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-3 rounded border border-neutral-300 p-4">
        <div className="hidden rounded border border-neutral-300 p-1.5 sm:block">
          <SquareChart className="size-5" />
        </div>
        <div>
          <label
            htmlFor={`${id}-switch`}
            className="block select-none text-pretty text-sm font-semibold text-neutral-900"
          >
            Enable conversion tracking for future links
          </label>
          <p className="mt-1 text-xs text-neutral-500">
            This only affects links made with the link builder. You can update
            this behavior later in your workspace settings.
          </p>
        </div>
        <ConversionTrackingToggleSwitch id={`${id}-switch`} />
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          className="text-sm leading-none text-neutral-500 underline transition-colors duration-75 hover:text-neutral-700"
          onClick={() => {
            setPaymentProcessorIndex(null);
          }}
        >
          Back to payment processors
        </button>
      </div>
    </div>
  );
}

export function useConversionOnboardingModal() {
  const [showConversionOnboardingModal, setShowConversionOnboardingModal] =
    useState(false);

  return {
    setShowConversionOnboardingModal,
    conversionOnboardingModal: (
      <ConversionOnboardingModal
        showConversionOnboardingModal={showConversionOnboardingModal}
        setShowConversionOnboardingModal={setShowConversionOnboardingModal}
      />
    ),
  };
}