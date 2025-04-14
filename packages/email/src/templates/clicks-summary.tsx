import { DUB_WORDMARK, nFormatter, smartTruncate } from "@dub/utils";
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Link2, MousePointerClick } from "lucide-react";
import { Footer } from "../components/footer";

export function ClicksSummary({
  email = "hello@novalink.io",
  workspaceName = "NovaLink",
  workspaceSlug = "novalink",
  totalClicks = 63689,
  createdLinks = 25,
  topLinks = [
    {
      link: "novalinkconnect.com/insta",
      clicks: 1820,
    },
    {
      link: "novalinkconnect.com/super-long-path-that-performs",
      clicks: 2187,
    },
    {
      link: "getnovalink.io",
      clicks: 1552,
    },
    {
      link: "novalink.com/twitter",
      clicks: 1229,
    },
    {
      link: "novalink.com/linkedin/deep/path",
      clicks: 1055,
    },
  ],
}: {
  email: string;
  workspaceName: string;
  workspaceSlug: string;
  totalClicks: number;
  createdLinks: number;
  topLinks: {
    link: string;
    clicks: number;
  }[];
}) {
  return (
    <Html>
      <Head />
      <Preview>Your 30-day performance summary for {workspaceName}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-semibold text-black">
              {workspaceName} — 30-day performance recap
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Over the last 30 days, your workspace{" "}
              <strong>{workspaceName}</strong> recorded:
              <br />
              <br />
              🔗 <strong>{nFormatter(createdLinks)} links created</strong>
              <br />
              📈 <strong>{nFormatter(totalClicks)} link clicks</strong>
            </Text>
            {topLinks.length > 0 && (
              <>
                <Text className="text-sm leading-6 text-black">
                  Top {topLinks.length} deeplinks by clicks:
                </Text>
                <Section>
                  <Row className="pb-2">
                    <Column align="left" className="text-sm text-neutral-500">
                      Link
                    </Column>
                    <Column align="right" className="text-sm text-neutral-500">
                      Clicks
                    </Column>
                  </Row>
                  {topLinks.map(({ link, clicks }, index) => {
                    const [domain, ...pathParts] = link.split("/");
                    const path = pathParts.join("/") || "_root";
                    return (
                      <div key={index}>
                        <Row>
                          <Column align="left">
                            <Link
                              href={`https://app.pimms.io/${workspaceSlug}/analytics?domain=${domain}&key=${path}`}
                              className="text-sm font-medium text-black underline"
                            >
                              {smartTruncate(link, 33)}↗
                            </Link>
                          </Column>
                          <Column
                            align="right"
                            className="text-sm text-neutral-600"
                          >
                            {nFormatter(clicks, { full: clicks < 99999 })}
                          </Column>
                        </Row>
                        {index !== topLinks.length - 1 && (
                          <Hr className="my-2 w-full border-[6px] border-neutral-100" />
                        )}
                      </div>
                    );
                  })}
                </Section>
              </>
            )}
            {createdLinks === 0 ? (
              <>
                <Text className="text-sm leading-6 text-black">
                  No new deeplinks were created during this period. If you need
                  help getting started, reply to this email or visit your dashboard.
                </Text>
                <Section className="my-8 text-center">
                  <Link
                    className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                    href={`https://app.pimms.io/${workspaceSlug}`}
                  >
                    Create a deeplink
                  </Link>
                </Section>
              </>
            ) : (
              <>
                <Text className="mt-10 text-sm leading-6 text-black">
                  To explore full analytics and performance breakdowns, use the
                  button below.
                </Text>
                <Section className="my-8 text-center">
                  <Link
                    className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                    href={`https://app.pimms.io/${workspaceSlug}/analytics?interval=30d`}
                  >
                    View full stats
                  </Link>
                </Section>
              </>
            )}
            <Footer
              email={email}
              notificationSettingsUrl={`https://app.pimms.io/${workspaceSlug}/settings/notifications`}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ClicksSummary;
