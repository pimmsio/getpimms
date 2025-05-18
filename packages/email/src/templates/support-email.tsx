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

export function SupportRequestEmail({
  email = "cheers@pimms.io",
  message = "How to setup Stripe?",
}: {
  email: string;
  message: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>New Support Request Received</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              New Support Request Received
            </Heading>
            <Text className="text-sm leading-6 text-black">
              New support request from <span className="font-semibold">{email}</span>
            </Text>
            <Text className="text-sm leading-6 text-black">{message}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default SupportRequestEmail;
