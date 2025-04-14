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

export function WebhookAdded({
  email = "cheers@pimms.io",
  workspace = {
    name: "PIMMS",
    slug: "pimms",
  },
  webhook = {
    name: "My Webhook",
  },
}: {
  email: string;
  workspace: {
    name: string;
    slug: string;
  };
  webhook: {
    name: string;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>New webhook added</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              New webhook added
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Webhook with the name <strong>{webhook.name}</strong> has been
              added to your PiMMs workspace {workspace.name}.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspace.slug}/settings/webhooks`}
              >
                View Webhook
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you did not create this webhook, you can{" "}
              <Link
                href={`https://app.pimms.io/${workspace.slug}/settings/webhooks`}
                className="text-black underline"
              >
                <strong>delete this webhook</strong>
              </Link>{" "}
              from your account.
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WebhookAdded;
