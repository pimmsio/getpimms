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

export function ConfirmEmailChange({
  email = "cheers@pimms.io",
  newEmail = "cheers+2@pimms.io",
  confirmUrl = "https://app.pimms.io/auth/confirm-email-change",
}: {
  email: string;
  newEmail: string;
  confirmUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address change</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Confirm your email address change
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              Follow this link to confirm the update to your email from{" "}
              <strong>{email}</strong> to <strong>{newEmail}</strong>.
            </Text>
            <Section className="my-8 text-center">
              <Link
                href={confirmUrl}
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
              >
                <strong>Confirm email change</strong>
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you did not request this change, this email can be safely
              ignored or{" "}
              <Link href={`${confirmUrl}?cancel=true`}>
                cancel this request
              </Link>
              .
            </Text>
            <Footer email={newEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ConfirmEmailChange;
