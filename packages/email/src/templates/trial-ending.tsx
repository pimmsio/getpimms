import { DUB_WORDMARK } from "@dub/utils";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";

export function TrialEnding({
  name = "there",
  email = "cheers@pimms.io",
  workspaceName = "My Workspace",
  workspaceSlug = "my-workspace",
  daysLeft = 2,
}: {
  name: string | null;
  email: string;
  workspaceName: string;
  workspaceSlug: string;
  daysLeft: number;
}) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          {`Your PiMMs Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
        </Preview>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img
                src={DUB_WORDMARK}
                height="14"
                alt="PIMMS"
                className="my-0"
              />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              Your Pro trial ends in {daysLeft} day
              {daysLeft !== 1 ? "s" : ""}
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Hey{name ? ` ${name}` : ""}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Just a heads up – the free Pro trial for your workspace{" "}
              <Link
                href={`https://app.pimms.io/${workspaceSlug}`}
                className="text-black underline"
              >
                <strong>{workspaceName}</strong>
              </Link>{" "}
              is ending soon. After that, your subscription will automatically
              start and you'll continue enjoying all Pro features.
            </Text>
            <Text className="text-sm leading-6 text-black">
              If you'd like to cancel before the trial ends, you can do so from
              your billing settings:
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="rounded border-none bg-[#3971ff] px-5 py-3 text-sm font-semibold text-white no-underline"
                href={`https://app.pimms.io/${workspaceSlug}/settings/billing`}
              >
                Manage billing
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you have any questions, just reply to this email – happy to
              help!
            </Text>
            <Text className="text-sm font-light leading-6 text-neutral-400">
              Alexandre from PIMMS
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default TrialEnding;
