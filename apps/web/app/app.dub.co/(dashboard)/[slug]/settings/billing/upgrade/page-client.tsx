"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { UpgradePlanButton } from "@/ui/workspaces/upgrade-plan-button";
import {
  Check,
  ToggleGroup,
  Badge,
  Tooltip,
} from "@dub/ui";
import { cn, getPricingForEvents, getLinksForEvents, getDomainsForEvents, type EventsLimit, detectCurrentTier } from "@dub/utils";
import { ChevronLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceBillingUpgradePageClient() {
  const workspace = useWorkspace();
  const { slug, plan: currentPlan, stripeId, eventsLimit = 5000 } = workspace;
  const router = useRouter();

  const [period, setPeriod] = useState<"monthly" | "yearly" | "lifetime">("monthly");
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  
  const availableTiers = [5000, 20000, 40000, 100000] as const;
  const selectedEventsLimit = availableTiers[selectedTierIndex];
  
  // Detect current tier for "Current plan" display
  const { isCurrentTier } = detectCurrentTier(eventsLimit);
  const isCurrentlySelectedTier = isCurrentTier(selectedEventsLimit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with Back Button */}
        <div className="relative mb-12">
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Fair <span className="bg-gradient-to-r from-[#2fcdfa] to-[#3970ff] bg-clip-text text-transparent">$</span> Pricing
            </h1>
            <p className="text-xl text-gray-600">Traffic-based plans to match your growth</p>
          </div>
        </div>

        {/* Traffic Selector */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium">
              Up to {selectedEventsLimit.toLocaleString('fr-FR')} monthly events
            </div>
          </div>
          
          <div className="relative max-w-2xl mx-auto">
            {/* Interactive Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max={availableTiers.length - 1}
                value={selectedTierIndex}
                onChange={(e) => setSelectedTierIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #1e293b 0%, #1e293b ${(selectedTierIndex / (availableTiers.length - 1)) * 100}%, #d1d5db ${(selectedTierIndex / (availableTiers.length - 1)) * 100}%, #d1d5db 100%)`
                }}
              />
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                {availableTiers.map((tier, index) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTierIndex(index)}
                    className={cn(
                      "font-medium transition-colors",
                      selectedTierIndex === index ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {tier === 5000 ? "5k" : tier === 20000 ? "20k" : tier === 40000 ? "40k" : "100k"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Pricing Cards */}
        <div className={cn(
          "grid gap-12 max-w-5xl mx-auto mb-20",
          selectedEventsLimit === 100000 ? "grid-cols-1 max-w-2xl" : "grid-cols-1 lg:grid-cols-2"
        )}>
          
          {/* Pro Subscription */}
          <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            {/* Monthly/Yearly Toggle - Absolute Top Right */}
            <div className="absolute top-4 right-4">
              <ToggleGroup
                options={[
                  { value: "monthly", label: "Monthly" },
                  { 
                    value: "yearly", 
                    label: "Yearly",
                    badge: <Badge className="bg-emerald-500 text-white text-xs px-2 py-1 ml-2">2 months free</Badge>
                  },
                ]}
                selected={period === "lifetime" ? "yearly" : period}
                selectAction={(value) => setPeriod(value as "monthly" | "yearly")}
                className="bg-gray-100 rounded-lg p-1"
                indicatorClassName="bg-white shadow-sm"
              />
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pro</h2>

              {/* Pricing */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    €{period === "yearly" 
                      ? Math.round(getPricingForEvents(selectedEventsLimit as EventsLimit, "yearly") / 12 * 10) / 10
                      : getPricingForEvents(selectedEventsLimit as EventsLimit, "monthly")}
                  </span>
                  <span className="text-xl text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-gray-600 mt-1">
                  {period === "yearly" 
                    ? `€${getPricingForEvents(selectedEventsLimit as EventsLimit, "yearly")} billed yearly`
                    : "Choose what you pay"}
                </p>
              </div>

            </div>

            {/* CTA Button - Fixed Position */}
            <div className="mb-8">
              <UpgradePlanButton
                eventsLimit={selectedEventsLimit as EventsLimit}
                period={period === "lifetime" ? "yearly" : period}
                text="Upgrade now!"
                className="w-full py-4 px-6 rounded-full text-lg font-semibold bg-gradient-to-r from-[#2fcdfa] to-[#3970ff] hover:shadow-lg transition-all duration-300"
              />
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-3">
                <CreditCard className="size-4" />
                <span>Secure payment via Stripe</span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">EVERYTHING INCLUDED:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">{getLinksForEvents(selectedEventsLimit as EventsLimit)} smart links /month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-blue-600 flex-shrink-0" />
                  <Tooltip content="Events are clicks, conversion leads, and sales. 1 event = 1 click = 1 lead = 1 sale collected = 10$ collected">
                    <span className="text-gray-700 underline decoration-dotted cursor-help">
                      {selectedEventsLimit.toLocaleString()} tracking events /month (click, lead, sale)
                    </span>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    {getDomainsForEvents(selectedEventsLimit as EventsLimit) === Infinity 
                      ? "Unlimited custom domains" 
                      : `${getDomainsForEvents(selectedEventsLimit as EventsLimit)} custom domains`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited team members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    {selectedEventsLimit === 5000 ? "6 months" : "12 months"} of data
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Lifetime - Hidden for 100k tier */}
          {selectedEventsLimit !== 100000 && (
          <div className="bg-slate-800 text-white rounded-2xl p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Lifetime</h2>
              
              {/* Pricing */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">€{getPricingForEvents(selectedEventsLimit as EventsLimit, "lifetime")}</span>
                  <span className="text-xl text-gray-400 ml-2">HT</span>
                </div>
                <p className="text-gray-300 mt-1">One-time payment, no subscription</p>
              </div>

              {/* CTA Button */}
              <UpgradePlanButton
                eventsLimit={selectedEventsLimit as EventsLimit}
                period="lifetime"
                variant="white"
                text="Get lifetime access →"
                className="w-full py-4 px-6 rounded-full text-lg font-semibold mb-4"
              />
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <CreditCard className="size-4" />
                <span>Secure payment via Stripe</span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">SAME AS PRO PLAN:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{getLinksForEvents(selectedEventsLimit as EventsLimit)} smart links /month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-green-400 flex-shrink-0" />
                  <Tooltip content="Events are clicks, conversion leads, and sales. 1 event = 1 click = 1 lead = 1 sale collected = 10$ collected">
                    <span className="text-gray-300 underline decoration-dotted cursor-help">
                      {selectedEventsLimit.toLocaleString()} tracking events /month (click, lead, sale)
                    </span>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">
                    {getDomainsForEvents(selectedEventsLimit as EventsLimit) === Infinity 
                      ? "Unlimited custom domains" 
                      : `${getDomainsForEvents(selectedEventsLimit as EventsLimit)} custom domains`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited team members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">
                    {selectedEventsLimit === 5000 ? "6 months" : "12 months"} of data
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Bottom Feature Pills */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">All plans include all available features including:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-gray-700">
            <span className="bg-gray-100 px-4 py-2 rounded-full">100+ INTEGRATIONS INCL. ZAPIER</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">SUPPORT STRIPE PAYMENTS</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">A/B TESTING</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">WEBHOOKS</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">UNLIMITED UTM</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">3 MONTHS PRIORITY SUPPORT</span>
          </div>
        </div>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #1e293b;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(30, 41, 59, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #1e293b;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(30, 41, 59, 0.3);
          border: none;
        }
        
        .slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
