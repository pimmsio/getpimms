import { DUB_WORDMARK, formatDate } from "@dub/utils";
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

export function APIKeyCreated({
  email = "cheers@pimms.io",
  workspace = {
    name: "PIMMS",
    slug: "pimms",
  },
  token = {
    name: "Acme API Key",
    type: "All access",
    permissions: "full access to all resources",
  },
}: {
  email: string;
  workspace: {
    name: string;
    slug: string;
  };
  token: {
    name: string;
    type: string;
    permissions: string;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>New Workspace API Key Created</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="mb-8 mt-6">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-6 p-0 text-lg font-medium text-black">
              New Workspace API Key Created
            </Heading>
            <Text className="text-sm leading-6 text-black">
              You've created a new API key for your PiMMs workspace{" "}
              <strong>{workspace.name}</strong> with the name{" "}
              <strong>"{token.name}"</strong> on{" "}
              {formatDate(new Date().toString())}.
            </Text>
            <Text className="text-sm leading-6 text-black">
              Since this is a <strong>{token.type}</strong> token, it has{" "}
              {token.permissions}.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspace.slug}/settings/tokens`}
              >
                View API Keys
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you did not create this API key, you can{" "}
              <Link
                href={`https://app.pimms.io/${workspace.slug}/settings/tokens`}
                className="text-black underline"
              >
                <strong>delete this key</strong>
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

export default APIKeyCreated;
