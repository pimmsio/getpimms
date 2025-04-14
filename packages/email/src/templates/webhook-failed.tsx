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

export default function WebhookFailed({
  email = "cheers@pimms.io",
  workspace = {
    name: "PIMMS",
    slug: "pimms",
  },
  webhook = {
    id: "wh_tYedrqsWgNJxUwQOaAnupcUJ1",
    url: "https://example.com/webhook",
    consecutiveFailures: 15,
    disableThreshold: 20,
  },
}: {
  email: string;
  workspace: {
    name: string;
    slug: string;
  };
  webhook: {
    id: string;
    url: string;
    consecutiveFailures: number;
    disableThreshold: number;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>Webhook is failing to deliver</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              Webhook is failing to deliver
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Your webhook <strong>{webhook.url}</strong> has failed to deliver{" "}
              {webhook.consecutiveFailures} times and will be disabled after{" "}
              {webhook.disableThreshold} consecutive failures.
            </Text>
            <Text className="text-sm leading-6 text-black">
              Please review the webhook details and update the URL if necessary
              to restore functionality.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspace.slug}/settings/webhooks/${webhook.id}/edit`}
              >
                Edit Webhook
              </Link>
            </Section>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
