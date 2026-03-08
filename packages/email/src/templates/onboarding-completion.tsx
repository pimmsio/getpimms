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
  providerIds,
  otherMessage,
}: {
  email: string;
  name?: string | null;
  workspaceName: string;
  answers: {
    trackingFamiliarity?: string | { useCases?: string[] };
    trackingSetup?: {
      firstGoals?: string[];
    };
    campaignTracking?: {
      currentMethod?: string;
    };
    // Legacy keys (kept for emails from users who started before the revamp)
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
  providerIds?: string[];
  otherMessage?: string;
}) {
  const formatUseCases = () => {
    const tf = answers.trackingFamiliarity;
    if (!tf) return "Not provided";
    if (typeof tf === "string") return tf;
    if (tf.useCases && tf.useCases.length > 0) return tf.useCases.join(", ");
    return "Not provided";
  };

  const formatTrackingSetupAnswers = () => {
    const t = answers.trackingSetup;
    if (!t) return "None";
    return t.firstGoals && t.firstGoals.length > 0
      ? t.firstGoals.join(", ")
      : "None";
  };

  const formatCampaignTracking = () => {
    const ct = answers.campaignTracking;
    if (!ct?.currentMethod) {
      // Fallback to legacy utmClicks if present
      const u = answers.utmClicks;
      if (!u) return "None";
      const parts: string[] = [];
      if (u.utmComfort) parts.push(`UTM usage: ${u.utmComfort}`);
      if (u.linksPerMonth) parts.push(`Links / month: ${u.linksPerMonth}`);
      if (u.orgNeeds && u.orgNeeds.length > 0) {
        parts.push(`Org needs: ${u.orgNeeds.join(", ")}`);
      }
      return parts.length > 0 ? parts.join("\n") : "None";
    }
    return ct.currentMethod;
  };

  const formatProviderIds = () => {
    if (!providerIds || providerIds.length === 0) return "None selected";
    const list = providerIds.filter((id) => id !== "other").join(", ");
    if (otherMessage) {
      return list ? `${list}\nOther: "${otherMessage}"` : `Other: "${otherMessage}"`;
    }
    if (providerIds.includes("other")) {
      return list ? `${list}, Other (no details provided)` : "Other (no details provided)";
    }
    return list || "None selected";
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
              New User Completed Onboarding
            </Heading>
            <Text className="text-sm leading-6 text-black">
              <span className="font-semibold">{name || email}</span> (
              {email}) just completed onboarding for workspace{" "}
              <span className="font-semibold">{workspaceName}</span>.
            </Text>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                What brings them to Pimms
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatUseCases()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                What they want to track
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatTrackingSetupAnswers()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                Tech stack (integrations)
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatProviderIds()}
              </Text>
            </Section>

            <Section className="my-6">
              <Heading className="mx-0 my-4 p-0 text-base font-medium text-black">
                How they track campaigns today
              </Heading>
              <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
                {formatCampaignTracking()}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OnboardingCompletionEmail;
