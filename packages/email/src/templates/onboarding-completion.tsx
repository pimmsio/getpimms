import { DUB_WORDMARK } from "@dub/utils";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export function OnboardingCompletionEmail({
  email,
  name,
  workspaceName,
  answers,
}: {
  email: string;
  name?: string | null;
  workspaceName: string;
  answers: {
    trackingFamiliarity?: string;
    utmConversion?: {
      utm?: {
        planToUse?: boolean;
        alreadyHasPlan?: boolean;
        wantsBulkUtm?: boolean;
        wantsTemplates?: boolean;
        wantsEnforceParams?: boolean;
      };
      conversion?: {
        contentToTrack?: string[];
        websitePlatform?: string;
        otherContent?: string;
      };
    };
  };
}) {
  const formatUtmAnswers = () => {
    if (!answers.utmConversion?.utm) return "None";
    const utm = answers.utmConversion.utm;
    const items: string[] = [];
    if (utm.planToUse) items.push("Plans to use UTM");
    if (utm.alreadyHasPlan) items.push("Already has UTM plan");
    if (utm.wantsBulkUtm) items.push("Wants bulk UTM");
    if (utm.wantsTemplates) items.push("Wants UTM templates");
    if (utm.wantsEnforceParams) items.push("Wants UTM enforce params");
    return items.length > 0 ? items.join(", ") : "None";
  };

  const formatConversionAnswers = () => {
    if (!answers.utmConversion?.conversion) return "None";
    const conv = answers.utmConversion.conversion;
    const parts: string[] = [];
    if (conv.contentToTrack && conv.contentToTrack.length > 0) {
      parts.push(`Content to track: ${conv.contentToTrack.join(", ")}`);
    }
    if (conv.websitePlatform) {
      parts.push(`Website platform: ${conv.websitePlatform}`);
    }
    if (conv.otherContent) {
      parts.push(`Other content: ${conv.otherContent}`);
    }
    return parts.length > 0 ? parts.join("\n") : "None";
  };

  return (
    <Html>
      <Head />
      <Preview>New User Completed Onboarding</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              🎉 New User Completed Onboarding
            </Heading>
            <Text className="text-sm leading-6 text-black">
              <span className="font-semibold">{name || email}</span> (
              {email}) just completed onboarding for workspace{" "}
              <span className="font-semibold">{workspaceName}</span>.
            </Text>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                Tracking Familiarity
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {answers.trackingFamiliarity || "Not provided"}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                UTM Tracking
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatUtmAnswers()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                Conversion Tracking
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatConversionAnswers()}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OnboardingCompletionEmail;
