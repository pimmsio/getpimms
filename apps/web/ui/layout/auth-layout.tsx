import { BlurImage, ClientOnly } from "@dub/ui";
import { Suspense } from "react";

const logos = [
  "vercel",
  "perplexity",
  "prisma",
  "tinybird",
  "hashnode",
  "cal",
  "vercel",
  "perplexity",
  "prisma",
  "tinybird",
  "hashnode",
  "cal",
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-5">
      <div className="col-span-1 flex min-h-screen flex-col items-center justify-between sm:col-span-3 p-3 bg-zinc-100">
        <div className="flex h-full w-full flex-col items-center justify-center">
          <ClientOnly className="relative flex w-full flex-col items-center justify-center">
            <Suspense>{children}</Suspense>
          </ClientOnly>
        </div>

        <div className="fixed bottom-0 left-10 grid gap-2 pb-8 pt-4">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} PIMMS. 
          </p>
          <div className="flex gap-3 text-center text-xs text-neutral-500 underline underline-offset-2">
            <a
              href="https://pimms.io/legal/privacy"
              target="_blank"
              className="hover:text-neutral-800"
            >
              Privacy Policy
            </a>
            <a
              href="https://pimms.io/legal/terms"
              target="_blank"
              className="hover:text-neutral-800"
            >
              Terms of Service
            </a>
            <a
              href="https://github.com/getpimms/pim.ms"
              target="_blank"
              className="hover:text-neutral-800"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-col justify-center space-y-12 md:col-span-2 md:flex bg-white shadow-[inset_0_0_10px_0_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="ml-12 h-1/2 w-[140%] rounded-xl shadow-md">
          <BlurImage
            alt="PIMMS Analytics"
            src="https://assets.pimms.io/dashboard.jpg?v=2"
            width={2400}
            height={1260}
            className="aspect-[2400/1260] h-full rounded-lg object-cover object-left-top"
          />
        </div>
        {/* <a
          href="https://pimms.io/customers"
          target="_blank"
          className="animate-infinite-scroll flex items-center space-x-4"
        >
          {logos.map((logo, idx) => (
            <BlurImage
              alt={`${logo} logo`}
              key={idx}
              src={`https://assets.pimms.io/clients/${logo}.svg`}
              width={520}
              height={182}
              className="h-12 grayscale transition-all hover:grayscale-0"
            />
          ))}
        </a> */}
      </div>
    </div>
  );
};
