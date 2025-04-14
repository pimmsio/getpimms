"use client";

import { ButtonLink } from "@/ui/placeholders/button-link";
import { FeaturesSection } from "@/ui/placeholders/features-section";
import { Hero } from "@/ui/placeholders/hero";
import { Logo } from "@dub/ui";
import { cn, createHref } from "@dub/utils";
import { useParams } from "next/navigation";
import { BubbleIcon } from "../../ui/placeholders/bubble-icon";
import { BrowserGraphic } from "./browser-graphic";

const UTM_PARAMS = {
  utm_source: "Custom Domain",
  utm_medium: "Welcome Page",
};

export default function PlaceholderContent() {
  const { domain } = useParams() as { domain: string };

  return (
    <div>
      <Hero>
        <div className="relative mx-auto flex w-full max-w-xl flex-col items-center">
          <BubbleIcon>
            <Logo className="size-10" />
          </BubbleIcon>
          <div className="mt-16 w-full">
            <BrowserGraphic domain={domain} />
          </div>
          <h1
            className={cn(
              "font-display mt-2 text-center text-4xl font-medium text-neutral-900 sm:text-5xl sm:leading-[1.15]",
              "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:20px] [animation-duration:1s] [animation-fill-mode:both]",
            )}
          >
            Welcome to PIMMS
          </h1>
          <p
            className={cn(
              "mt-5 text-balance text-base text-neutral-700 sm:text-xl",
              "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:10px] [animation-delay:200ms] [animation-duration:1s] [animation-fill-mode:both]",
            )}
          >
            This custom domain is powered by PIMMS &ndash; the deep link
            platform designed to open your prospecting content in the right
            mobile apps, driving more conversion and growth.
          </p>
        </div>

        <div
          className={cn(
            "xs:flex-row relative mx-auto mt-8 flex max-w-fit flex-col items-center gap-4",
            "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:5px] [animation-delay:300ms] [animation-duration:1s] [animation-fill-mode:both]",
          )}
        >
          <ButtonLink variant="primary" href="https://app.pimms.io/register">
            Try PIMMS today
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            href={createHref("/", domain, {
              ...UTM_PARAMS,
              utm_campaign: domain,
              utm_content: "Learn more",
            })}
          >
            Learn more
          </ButtonLink>
        </div>
      </Hero>
      <div className="mt-20">
        <FeaturesSection domain={domain} utmParams={UTM_PARAMS} />
      </div>
      {/* <div className="mt-32">
        <CTA domain={domain} utmParams={UTM_PARAMS} />
      </div> */}
    </div>
  );
}
