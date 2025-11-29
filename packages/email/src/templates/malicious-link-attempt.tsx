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

export function MaliciousLinkAttemptEmail({
  url,
  domain,
  userEmail,
  userName,
  workspaceName,
  workspaceSlug,
  reason = "blacklisted domain",
}: {
  url: string;
  domain: string;
  userEmail?: string;
  userName?: string;
  workspaceName?: string;
  workspaceSlug?: string;
  reason?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Malicious Link Attempt Detected</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              ⚠️ Malicious Link Attempt Detected
            </Heading>
            <Text className="text-sm leading-6 text-black">
              A user attempted to create a link to a blacklisted domain.
            </Text>
            <Section className="my-6 rounded-lg bg-neutral-50 p-4">
              <Text className="my-2 text-sm font-semibold text-black">
                Blocked URL:
              </Text>
              <Text className="my-2 text-sm text-black">{url}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Domain:
              </Text>
              <Text className="my-2 text-sm text-black">{domain}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Reason:
              </Text>
              <Text className="my-2 text-sm text-black">{reason}</Text>
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

export default MaliciousLinkAttemptEmail;

