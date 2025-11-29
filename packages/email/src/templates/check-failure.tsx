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

export function CheckFailureEmail({
  url,
  domain,
  service,
  error,
}: {
  url: string;
  domain: string;
  service: string;
  error: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Security Check Service Failure</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              ⚠️ Security Check Service Failure
            </Heading>
            <Text className="text-sm leading-6 text-black">
              {service} failed to check a URL. The link was allowed through, but
              you should verify it manually.
            </Text>
            <Section className="my-6 rounded-lg bg-orange-50 p-4">
              <Text className="my-2 text-sm font-semibold text-black">
                URL:
              </Text>
              <Text className="my-2 text-sm text-black">{url}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Domain:
              </Text>
              <Text className="my-2 text-sm text-black">{domain}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Service:
              </Text>
              <Text className="my-2 text-sm text-black">{service}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Error:
              </Text>
              <Text className="my-2 text-sm text-black">{error}</Text>
            </Section>
            <Text className="mt-6 text-xs text-neutral-500">
              This is an automated notification from PIMMS security system.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default CheckFailureEmail;

