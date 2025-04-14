import { DUB_WORDMARK, getPrettyUrl } from "@dub/utils";
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

export const REFERRAL_CLICKS_QUOTA_BONUS = 500;

export function NewReferralSignup({
  email = "cheers@pimms.io",
  workspace = {
    name: "PIMMS",
    slug: "pimms",
  },
}: {
  email: string;
  workspace: {
    name: string;
    slug: string;
  };
}) {
  const referralLink = `https://refer.pimms.io/${workspace.slug}`;
  return (
    <Html>
      <Head />
      <Preview>New referral signup</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              New referral signup
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Congratulations – someone just signed up for PiMMs using your
              referral link:{" "}
              <a
                href={referralLink}
                className="text-semibold font-medium text-black underline"
              >
                {getPrettyUrl(referralLink)}
              </a>
            </Text>
            <Text className="text-sm leading-6 text-black">
              As a thank you from us for spreading the word about PiMMs, you've
              earned an additional {REFERRAL_CLICKS_QUOTA_BONUS} clicks quota
              for your{" "}
              <a
                href={`https://app.pimms.io/${workspace.slug}`}
                className="text-semibold font-medium text-black underline"
              >
                {workspace.name}
              </a>{" "}
              workspace on PiMMs.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspace.slug}`}
              >
                View your referral stats
              </Link>
            </Section>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default NewReferralSignup;
