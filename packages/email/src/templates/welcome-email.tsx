import { DUB_THUMBNAIL, DUB_WORDMARK } from "@dub/utils";
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

export function WelcomeEmail({
  name = "Brendon Urie",
  email = "cheers@pimms.io",
}: {
  name: string | null;
  email: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to PiMMs</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-semibold text-black">
              Welcome to PIMMS
            </Heading>
            <Section className="my-8 text-center">
              <Img src={DUB_THUMBNAIL} alt="PIMMS" className="max-w-[500px]" />
            </Section>
            <Text className="text-sm leading-6 text-black">
              Thanks for signing up{name && `, ${name}`}!
            </Text>
            <Footer email={email} marketing />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
