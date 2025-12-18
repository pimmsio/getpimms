import { NextButton } from "../next-button";
import TrackSignup from "./track-signup";
import { 
  Share2, 
  MessageSquare, 
  CreditCard, 
  TrendingUp
} from "lucide-react";

export default function Welcome() {
  return (
    <>
      <TrackSignup />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-16 md:px-8">
        {/* Main Content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="animate-slide-up-fade text-4xl font-bold text-gray-900 md:text-5xl [--offset:10px] [animation-delay:250ms] [animation-duration:1s] [animation-fill-mode:both]">
                Turn More Clicks into Sales
              </h1>
              <p className="animate-slide-up-fade mt-6 text-lg text-gray-600 md:text-xl [--offset:10px] [animation-delay:500ms] [animation-duration:1s] [animation-fill-mode:both]">
                For creators, growth experts, and marketing teams aiming to collect 1000+ leads weekly, book more meetings, and grow revenue.
              </p>
            </div>

            {/* CTA Button */}
            <div className="animate-slide-up-fade mt-10 flex justify-center [--offset:10px] [animation-delay:750ms] [animation-duration:1s] [animation-fill-mode:both]">
              <NextButton 
                text="Get Started" 
                step="tracking-familiarity" 
                className="h-12 px-8 text-lg font-semibold"
              />
            </div>

            {/* Product Tour */}
            <div className="animate-slide-up-fade mt-16 [--offset:10px] [animation-delay:1000ms] [animation-duration:1s] [animation-fill-mode:both]">
              <div className="text-center mb-8">
                <p className="mt-4 text-lg text-gray-600">
                  Watch this quick tour to see how PIMMS can transform your marketing
                </p>
              </div>
              
              <div className="w-full max-w-4xl mx-auto">
                <div style={{ 
                  position: "relative", 
                  boxSizing: "content-box", 
                  maxHeight: "80vh", 
                  width: "100%", 
                  aspectRatio: "2.0708333333333333", 
                  padding: "40px 0 40px 0" 
                }}>
                  <iframe 
                    src="https://app.supademo.com/embed/cmf48okbm25sp39oz0s30axfb?embed_v=2&utm_source=embed" 
                    loading="lazy" 
                    title="Pimms Onboarding" 
                    allow="clipboard-write" 
                    frameBorder="0" 
                    allowFullScreen 
                    style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      width: "100%", 
                      height: "100%" 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="animate-slide-up-fade mt-16 [--offset:10px] [animation-delay:1250ms] [animation-duration:1s] [animation-fill-mode:both]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                  Key Features
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FeatureCard
                  icon={<Share2 className="h-6 w-6 text-blue-600" />}
                  title="Post on social media"
                  description="Share links on LinkedIn, YouTube, X, Instagram or TikTok. Manage and create UTM campaigns in one dashboard. Organize your links with tags and comments."
                />
                <FeatureCard
                  icon={<MessageSquare className="h-6 w-6 text-green-600" />}
                  title="Outreach like never"
                  description="Connect with your customers with Lemlist, Brevo, Tally, Cal.com, iClosed, Systeme.io, and more. Automate your outreach and collect leads on autopilot."
                />
                <FeatureCard
                  icon={<CreditCard className="h-6 w-6 text-purple-600" />}
                  title="Turn clicks into cash"
                  description="Connect payment systems like Stripe, Shopify, Systeme.io in one click. Our native integrations guide you through approvals without any hassle."
                />
                <FeatureCard
                  icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
                  title="Grow on autopilot"
                  description="Track real time analytics and scale while we run the backend. Spot growth opportunities and expand operation with full support from our team."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed pl-11">{description}</p>
    </div>
  );
}
