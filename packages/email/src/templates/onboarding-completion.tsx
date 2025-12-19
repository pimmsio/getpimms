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
    trackingSetup?: {
      firstGoals?: string[];
    };
    utmConversion?: {
      trackingGoal?: string;
      conversionTypes?: string[];
      linkVolume?: string;
    };
    deepLinks?: {
      wantsDeepLinks?: string;
    };
    utmClicks?: {
      utmComfort?: string;
      linksPerMonth?: string;
      orgNeeds?: string[];
    };
  };
}) {
  const formatUtmConversionAnswers = () => {
    const utm = answers.utmConversion;
    if (!utm) return "None";
    const parts: string[] = [];
    if (utm.trackingGoal) parts.push(`Tracking goal: ${utm.trackingGoal}`);
    if (utm.linkVolume) parts.push(`Link volume: ${utm.linkVolume}`);
    if (utm.conversionTypes && utm.conversionTypes.length > 0) {
      parts.push(`Conversions: ${utm.conversionTypes.join(", ")}`);
    }
    return parts.length > 0 ? parts.join("\n") : "None";
  };

  const formatDeepLinksAnswers = () => {
    const dl = answers.deepLinks;
    if (!dl) return "None";
    const parts: string[] = [];
    if (dl.wantsDeepLinks) parts.push(`Wants deep links: ${dl.wantsDeepLinks}`);
    return parts.length > 0 ? parts.join("\n") : "None";
  };

  const formatTrackingSetupAnswers = () => {
    const t = answers.trackingSetup;
    if (!t) return "None";
    return t.firstGoals && t.firstGoals.length > 0
      ? `First capture: ${t.firstGoals.join(", ")}`
      : "None";
  };

  const formatUtmClicksAnswers = () => {
    const u = answers.utmClicks;
    if (!u) return "None";
    const parts: string[] = [];
    if (u.utmComfort) parts.push(`UTM usage: ${u.utmComfort}`);
    if (u.linksPerMonth) parts.push(`Links / month: ${u.linksPerMonth}`);
    if (u.orgNeeds && u.orgNeeds.length > 0) {
      parts.push(`Org needs: ${u.orgNeeds.join(", ")}`);
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
                Quick Check-in
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatUtmConversionAnswers()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                Deep Links
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatDeepLinksAnswers()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                Tracking Setup
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatTrackingSetupAnswers()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                UTM Setup
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatUtmClicksAnswers()}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OnboardingCompletionEmail;
