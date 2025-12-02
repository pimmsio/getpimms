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

export function FreePlanRedirectAttemptEmail({
  url,
  redirectCount,
  redirectChain,
  userEmail,
  userName,
  workspaceName,
  workspaceSlug,
}: {
  url: string;
  redirectCount: number;
  redirectChain: string[];
  userEmail?: string;
  userName?: string;
  workspaceName?: string;
  workspaceSlug?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Free Plan User Attempted to Use Redirects</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              💎 Free Plan Redirect Attempt
            </Heading>
            <Text className="text-sm leading-6 text-black">
              A free plan user attempted to create a link with redirects. This
              feature is restricted to paid plans as a preventive security measure.
            </Text>
            <Section className="my-6 rounded-lg bg-neutral-50 p-4">
              <Text className="my-2 text-sm font-semibold text-black">
                Original URL:
              </Text>
              <Text className="my-2 text-sm text-black">{url}</Text>
              <Text className="my-2 text-sm font-semibold text-black">
                Redirect Count:
              </Text>
              <Text className="my-2 text-sm text-black">
                {redirectCount} redirect{redirectCount !== 1 ? 's' : ''} detected
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
            <Section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Text className="my-1 text-sm font-semibold text-blue-900">
                💡 Potential Upgrade Opportunity
              </Text>
              <Text className="my-1 text-xs text-blue-800">
                This user may be interested in upgrading to access redirect features.
              </Text>
            </Section>
            <Text className="mt-6 text-xs text-neutral-500">
              This is an automated notification from PIMMS security system.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default FreePlanRedirectAttemptEmail;

