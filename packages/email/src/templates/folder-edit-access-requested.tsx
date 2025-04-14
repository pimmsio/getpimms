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

export function FolderEditAccessRequested({
  email = "cheers@pimms.io",
  folderUrl = "http://localhost:8888/pimms/settings/library/folders/cm1elre430005nf59czif340u/members",
  folder = {
    name: "Social Media",
  },
  requestor = {
    name: "Brendon Urie",
    email: "cheers@pimms.io",
  },
}: {
  email: string;
  folderUrl: string;
  folder: {
    name: string;
  };
  requestor: {
    name: string;
    email: string;
  };
}) {
  return (
    <Html>
      <Head />
      <Preview>Request to edit folder {folder.name} on PiMMs</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded-3xl border-[6px] border-solid border-neutral-100 px-10 py-5">
            <Section className="my-8">
              <Img src={DUB_WORDMARK} height="14" alt="PIMMS" className="my-0" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Request to edit {folder.name}
            </Heading>
            <Text className="text-sm leading-6 text-black">
              <strong>{requestor.name}</strong> (
              <Link
                className="text-blue-600 no-underline"
                href={`mailto:${requestor.email}`}
              >
                {requestor.email}
              </Link>
              ) is requesting edit access to the folder&nbsp;
              <strong>{folder.name}</strong>.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="px-5 py-3 bg-[#dc2e65] text-white font-semibold outline outline-[6px] transition outline-[#ffeaf1] cursor-pointer no-underline rounded-xl"
                href={folderUrl}
              >
                View folder
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {folderUrl.replace(/^https?:\/\//, "")}
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default FolderEditAccessRequested;
