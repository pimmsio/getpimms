import { DUB_WORKSPACE_ID, SHORT_DOMAIN } from "./main";

export const DUB_DOMAINS = [
  {
    id: "clce1z7ch00j0rbstbjufva4j",
    slug: SHORT_DOMAIN,
    verified: true,
    primary: true,
    archived: false,
    placeholder: "https://youtu.be/BY_XwvKogC8",
    allowedHostnames: null as string[] | null,
    description: "The default domain for all new accounts.",
    projectId: DUB_WORKSPACE_ID,
  },
];

export const DUB_DOMAINS_ARRAY = DUB_DOMAINS.map((domain) => domain.slug);

export const DUB_DEMO_LINKS = [
  {
    id: "cltshzzpd0005126z3rd2lvo4",
    domain: "pim.ms",
    key: "try",
    dashboardId: "dash_bUNOfMQVcKS0VMDa2HaYhOjg",
  },
];
