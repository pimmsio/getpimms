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

export function DomainClaimed({
  email = "cheers@pimms.io",
  domain = "dub.link",
  workspaceSlug = "dub",
}: {
  email: string;
  domain: string;
  workspaceSlug: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Successfully claimed your .link domain!</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Successfully claimed your .link domain!
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Congratulations! You have successfully claimed your free{" "}
              <code className="text-purple-600">{domain}</code> domain for your
              PiMMs workspace{" "}
              <Link
                href={`https://app.pimms.io/${workspaceSlug}`}
                className="font-medium text-blue-600 no-underline"
              >
                {workspaceSlug}↗
              </Link>
              .
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspaceSlug}/settings/domains`}
              >
                Manage your domain
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Once the domain is fully provisioned, you can start creating links
              with it. This process can take up to 1 hour.
            </Text>
            <Text className="text-sm leading-6 text-black">
              If your domain is not active after 1 hour, please reply to this
              email and we will look into it.
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DomainClaimed;
