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

export function DomainDeleted({
  email = "cheers@pimms.io",
  domain = "pim.ms",
  workspaceSlug = "pimms",
}: {
  email: string;
  domain: string;
  workspaceSlug: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Domain Deleted</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Domain Deleted
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Your domain <code className="text-purple-600">{domain}</code> for
              your PiMMs workspace{" "}
              <Link
                href={`https://app.pimms.io/${workspaceSlug}`}
                className="font-medium text-blue-600 no-underline"
              >
                {workspaceSlug}↗
              </Link>{" "}
              has been invalid for 30 days. As a result, it has been deleted
              from PiMMs.
            </Text>
            <Text className="text-sm leading-6 text-black">
              If you would like to restore the domain, you can easily create it
              again on PiMMs with the link below.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspaceSlug}/settings/domains`}
              >
                Add a domain
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you don’t plan to keep using this domain on PiMMs, feel free to
              ignore this email.
            </Text>
            <Footer
              email={email}
              notificationSettingsUrl={`https://app.pimms.io/${workspaceSlug}/settings/notifications`}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DomainDeleted;
