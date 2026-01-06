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

export function TooManyRedirectsEmail({
  url,
  hopsFollowed,
  redirectChain,
  apexDomains,
  userEmail,
  userName,
  workspaceName,
  workspaceSlug,
}: {
  url: string;
  hopsFollowed: number;
  redirectChain: string[];
  apexDomains: string[];
  userEmail?: string;
  userName?: string;
  workspaceName?: string;
  workspaceSlug?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Too Many Redirects Detected</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              ⚠️ Too Many Redirects Detected
            </Heading>
            <Text className="text-sm leading-6 text-black">
              A user attempted to create a link that exceeds the maximum allowed
              number of redirects. This may indicate a security issue or a
              misconfigured URL.
            </Text>
            <Section className="my-6 rounded-lg bg-neutral-50 p-4">
              <Text className="my-2 text-sm font-semibold text-black">
                Original URL:
              </Text>
              <Text className="my-2 text-sm text-black">{url}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Redirect hops followed:
              </Text>
              <Text className="my-2 text-sm text-black">
                {hopsFollowed} hops (limit reached)
              </Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Apex domains detected:
              </Text>
              <Text className="my-2 text-sm text-black">
                {apexDomains.length ? apexDomains.join(", ") : "(unknown)"}
              </Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Redirect Chain:
              </Text>
              {redirectChain.map((redirectUrl, index) => (
                <Text key={index} className="my-1 text-xs text-neutral-600">
                  {index + 1}. {redirectUrl}
                </Text>
              ))}
            </Section>
            {(userEmail || userName) && (
              <Section className="my-6">
                <Text className="text-sm font-semibold text-black">User:</Text>
                {userName && (
                  <Text className="text-sm text-black">Name: {userName}</Text>
                )}
                {userEmail && (
                  <Text className="text-sm text-black">Email: {userEmail}</Text>
                )}
              </Section>
            )}
            {(workspaceName || workspaceSlug) && (
              <Section className="my-6">
                <Text className="text-sm font-semibold text-black">
                  Workspace:
                </Text>
                {workspaceName && (
                  <Text className="text-sm text-black">
                    Name: {workspaceName}
                  </Text>
                )}
                {workspaceSlug && (
                  <Text className="text-sm text-black">Slug: {workspaceSlug}</Text>
                )}
              </Section>
            )}
            <Text className="mt-6 text-xs text-neutral-500">
              This is an automated notification from PIMMS security system.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default TooManyRedirectsEmail;

