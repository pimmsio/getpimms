import { COUNTRIES, DUB_WORDMARK, smartTruncate } from "@dub/utils";
import { nFormatter } from "@dub/utils/src/functions";
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
import { Footer } from "../components/footer";

export function DubWrapped({
  email = "cheers@pimms.io",
  workspace = {
    name: "PIMMS",
    slug: "pimms",
    logo: "https://assets.pimms.io/logo.png",
  },
  stats = {
    "Total Links": 1429,
    "Total Clicks": 425319,
  },
  topLinks = [
    {
      item: "pim.ms/link",
      count: 13923,
    },
    {
      item: "pim.ms/link",
      count: 2225,
    },
    {
      item: "pim.ms/link",
      count: 423,
    },
    {
      item: "pim.ms/link",
      count: 325,
    },
    {
      item: "pim.ms/link",
      count: 233,
    },
  ],
  topCountries = [
    {
      item: "US",
      count: 23049,
    },
    {
      item: "GB",
      count: 12345,
    },
    {
      item: "CA",
      count: 10000,
    },
    {
      item: "DE",
      count: 9000,
    },
    {
      item: "FR",
      count: 8000,
    },
  ],
}: {
  email: string;
  workspace: {
    name: string;
    slug: string;
    logo?: string | null;
  };
  stats: {
    "Total Links": number;
    "Total Clicks": number;
  };
  topLinks: {
    item: string;
    count: number;
  }[];
  topCountries: {
    item: string;
    count: number;
  }[];
}) {
  const dubStats = [
    {
      item: "126M clicks tracked",
      increase: "+900%",
    },
    {
      item: "700K links created",
      increase: "+400%",
    },
    {
      item: "56K new users",
      increase: "+360%",
    },
    {
      item: "5.5K custom domains",
      increase: "+500%",
    },
  ];

  const shippedItems = [
    {
      title: "New link builder + dashboard",
      description:
        "We launched a new link builder, rebuilt from the ground up, to help you manage your links better. We also gave our dashboard a makeover as well.",
      image: "https://assets.pimms.io/dashboard.jpg?v=2",
      cta: {
        text: "Read the announcement",
        href: "https://ship.pimms.io/builder",
      },
    },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        In 2025, you created {nFormatter(stats["Total Links"], { full: true })}{" "}
        links on PiMMs and got {nFormatter(stats["Total Clicks"], { full: true })}{" "}
        clicks.
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="32" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 mb-4 mt-8 p-0 text-xl font-semibold text-black">
            PIMMS Year in Review 🎊
            </Heading>
            <Text className="text-sm leading-6 text-black">
              As we put a wrap on 2025, we wanted to say thank you for your
              support! Here's a look back at your activity in 2025:
            </Text>

            <Section className="my-8 rounded-lg border-[6px] border-solid border-neutral-100 p-2">
              <div>
                <div className="-mt-[90px] mb-[30px] text-center">
                  {workspace.logo && (
                    <Img
                      src={workspace.logo}
                      height="36"
                      alt={workspace.name}
                      className="mx-auto rounded-lg"
                    />
                  )}
                  <Text className="mt-1 text-xl font-semibold">
                    {workspace.name}
                  </Text>
                </div>
              </div>
              <Row className="w-full px-4 py-2">
                {Object.entries(stats).map(([key, value]) => (
                  <StatCard key={key} title={key} value={value} />
                ))}
              </Row>
              <div className="grid gap-2 px-4">
                <StatTable
                  title="Top Links"
                  value={topLinks}
                  workspaceSlug={workspace.slug}
                />
                <StatTable
                  title="Top Countries"
                  value={topCountries}
                  workspaceSlug={workspace.slug}
                />
              </div>
            </Section>

            <Heading className="mx-0 mb-4 mt-8 p-0 text-xl font-semibold text-black">
              Your contribution 📈
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Thanks to customers like you, we had an incredible year as well,
              seeing record activity and link clicks:
            </Text>
            {dubStats.map((stat) => (
              <Text
                key={stat.item}
                className="ml-1 text-sm font-medium leading-4 text-black"
              >
                ◆ {stat.item}{" "}
                <span className="font-semibold text-green-700">
                  ({stat.increase})
                </span>
              </Text>
            ))}
            <Footer email={email} marketing />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => {
  return (
    <Column className="text-center">
      <Text className="font-medium text-neutral-400">{title}</Text>
      <Text className="-mt-3 text-lg font-medium text-black">
        {typeof value === "number" ? nFormatter(value, { full: true }) : value}
      </Text>
    </Column>
  );
};

const StatTable = ({
  title,
  value,
  workspaceSlug,
}: {
  title: string;
  value: { item: string; count: number }[];
  workspaceSlug: string;
}) => {
  return (
    <Section>
      <Text className="mb-0 font-medium text-neutral-400">{title}</Text>
      {value.map(({ item, count }, index) => {
        const [domain, ...pathParts] = item.split("/");
        const path = pathParts.join("/") || "_root";
        return (
          <div key={index} className="text-sm">
            <Row>
              {title === "Top Countries" && (
                <Column width={24}>
                  <Img
                    src={`https://wsrv.nl/?url=https://hatscripts.github.io/circle-flags/flags/${item.toLowerCase()}.svg`}
                    alt={COUNTRIES[item]}
                    height="16"
                  />
                </Column>
              )}
              <Column align="left">
                {title === "Top Links" ? (
                  <div className="py-2">
                    <Link
                      href={`https://app.pimms.io/${workspaceSlug}/analytics?domain=${domain}&key=${path}&interval=1y`}
                      className="font-medium text-black underline underline-offset-2"
                    >
                      {smartTruncate(item, 33)} ↗
                    </Link>
                  </div>
                ) : (
                  <p>{COUNTRIES[item]}</p>
                )}
              </Column>
              <Column align="right" className="text-neutral-600">
                {nFormatter(count, { full: count < 99999 })}
              </Column>
            </Row>
            {index !== value.length - 1 && (
              <Hr className="my-0 w-full border-[6px] border-neutral-100" />
            )}
          </div>
        );
      })}
    </Section>
  );
};

export default DubWrapped;
