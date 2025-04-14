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

export function CampaignImported({
  email = "cheers@pimms.io",
  provider = "Rewardful",
  workspace = {
    slug: "acme",
  },
  program = {
    id: "prog_CYCu7IMAapjkRpTnr8F1azjN",
    name: "Cal",
  },
}: {
  email: string;
  provider: "Rewardful";
  workspace: {
    slug: string;
  };
  program: {
    id: string;
    name: string;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>Your {provider} campaign has been imported</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="mb-8 mt-6">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Your {provider} campaign has been imported
            </Heading>
            <Text className="text-sm leading-6 text-black">
              We have successfully imported your {provider} campaign{" "}
              <Link
                href={`https://app.pimms.io/${workspace.slug}/programs/${program.id}/partners`}
                className="font-medium text-blue-600 no-underline"
              >
                {program.name}↗
              </Link>{" "}
              into PiMMs.
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default CampaignImported;
