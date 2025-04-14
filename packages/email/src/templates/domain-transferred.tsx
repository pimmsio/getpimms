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

export function DomainTransferred({
  email = "cheers@pimms.io",
  domain = "pim.ms",
  newWorkspace = { name: "PIMMS", slug: "pimms" },
  linksCount = 50,
}: {
  email: string;
  domain: string;
  newWorkspace: Pick<WorkspaceProps, "name" | "slug">;
  linksCount: number;
}) {
  return (
    <Html>
      <Head />
      <Preview>Domain Transferred</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Domain Transferred
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Your domain <code className="text-purple-600">{domain}</code>{" "}
              {linksCount > 0 && (
                <>and its {linksCount > 0 ? linksCount : ""} links </>
              )}
              has been transferred to the workspace{" "}
              <Link
                href={`https://app.pimms.io/${newWorkspace.slug}/settings/domains`}
                className="font-medium text-blue-600 no-underline"
              >
                {newWorkspace.name}↗
              </Link>
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DomainTransferred;
