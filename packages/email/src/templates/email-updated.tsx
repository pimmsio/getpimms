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

export function EmailUpdated({
  oldEmail = "cheers@pimms.io",
  newEmail = "cheers@pimms.io",
}: {
  oldEmail: string;
  newEmail: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your email address has been updated</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Your email address has been changed
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              The e-mail address for your PiMMs account has been changed from{" "}
              <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
            </Text>
            <Text className="text-sm leading-6 text-black">
              If you did not make this change, please contact our support team
              or{" "}
              <Link href="https://app.pimms.io/account/settings">
                update your email address
              </Link>
              .
            </Text>
            <Text className="text-sm leading-6 text-black">
              This message is being sent to your old e-mail address only.
            </Text>
            <Footer email={oldEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default EmailUpdated;
