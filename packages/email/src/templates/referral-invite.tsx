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

export function ReferralInvite({
  email = "cheers@pimms.io",
  url = "https://pimms.io",
  workspaceUser = "Brendon Urie",
  workspaceUserEmail = "cheers@pimms.io",
}: {
  email: string;
  url: string;
  workspaceUser: string | null;
  workspaceUserEmail: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>Register for PiMMs</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              Register for PiMMs
            </Heading>
            {workspaceUser && workspaceUserEmail ? (
              <Text className="text-sm leading-6 text-black">
                <strong>{workspaceUser}</strong> (
                <Link
                  className="text-blue-600 no-underline"
                  href={`mailto:${workspaceUserEmail}`}
                >
                  {workspaceUserEmail}
                </Link>
                ) has invited you to start using PiMMs!
              </Text>
            ) : (
              <Text className="text-sm leading-6 text-black">
                You have been invited to start using PiMMs!
              </Text>
            )}
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={url}
              >
                Learn More
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ReferralInvite;
