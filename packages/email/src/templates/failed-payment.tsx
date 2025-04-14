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
import { WorkspaceProps } from "../types";

export function FailedPayment({
  user = { name: "Brendon Urie", email: "cheers@pimms.io" },
  workspace = { name: "PIMMS", slug: "pimms" },
  amountDue = 2400,
  attemptCount = 2,
}: {
  user: { name?: string | null; email: string };
  workspace: Pick<WorkspaceProps, "name" | "slug">;
  amountDue: number;
  attemptCount: number;
}) {
  const title = `${
    attemptCount == 2 ? "2nd notice: " : attemptCount == 3 ? "3rd notice: " : ""
  }Your payment for PiMMs failed`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              {attemptCount == 2 ? "2nd " : attemptCount == 3 ? "3rd  " : ""}
              Failed Payment for PiMMs
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Hey{user.name ? `, ${user.name}` : ""}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Your payment of{" "}
              <code className="text-purple-600">${amountDue / 100}</code> for
              your PiMMs workspace{" "}
              <code className="text-purple-600">{workspace.name}</code> has
              failed. Please update your payment information using the link below:
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={`https://app.pimms.io/${workspace.slug}/settings/billing`}
              >
                Update payment information
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you have any questions, feel free to respond to this email –
              we're happy to help!
            </Text>
            <Footer email={user.email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default FailedPayment;
