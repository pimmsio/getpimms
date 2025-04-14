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

export function PartnerInvite({
  email = "cheers@pimms.io",
  program = {
    name: "PiMMs",
    logo: DUB_WORDMARK,
  },
}: {
  email: string;
  program: {
    name: string;
    logo: string | null;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>
        You're invited: Join the {program.name} Affiliate Program and start
        earning!
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="mb-8 mt-6">
              <Img
                src={program.logo || "https://assets.pimms.io/logo.png"}
                height="32"
                alt={program.name}
              />
            </Section>

            <Heading className="mx-0 p-0 text-lg font-medium text-black">
              {program.name} invited you to join their Affiliate Program!
            </Heading>

            <Text className="text-sm leading-6 text-neutral-600">
              The {program.name} Affiliate Program, powered by PiMMs, invites
              you to help spread the word and grow with us.
            </Text>
            <Text className="text-sm leading-6 text-neutral-600">
              With easy-to-use affiliate tools, intuitive tracking, and
              dedicated support, becoming a {program.name} affiliate is simple
              and rewarding.
            </Text>
            <Text className="text-sm leading-6 text-neutral-600">
              Join today and start turning your recommendations into results.
            </Text>

            <Section className="mb-12 mt-8">
              <Link
                className="cursor-pointer rounded-xl bg-[#dc2e65] px-5 py-3 font-semibold text-white no-underline outline outline-[6px] outline-[#ffeaf1] transition"
                href="https://partners.pimms.io/register"
              >
                Accept Invite
              </Link>
            </Section>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PartnerInvite;
