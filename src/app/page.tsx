/**
 * Landing Page
 *
 * The home page of the AutoQuote AI application.
 * Displays the value proposition and call to action.
 *
 * @module app/page
 */

import Link from "next/link";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";

/**
 * Feature item for the "How it works" section.
 */
function FeatureStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center">
        {number}
      </span>
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </div>
  );
}

/**
 * Landing page component.
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Get Repair Quotes{" "}
          <span className="text-gradient">Fast</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
          Upload a photo of your car damage, and our AI will call multiple shops
          simultaneously to get you the best quotes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-lg px-8 py-6"
          >
            <Link href="/auth/login">Start New Quote</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
          >
            <a href="#how-it-works">Learn More</a>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mb-16">
        {[
          { value: "5min", label: "Average Time" },
          { value: "10+", label: "Shops Called" },
          { value: "30%", label: "Avg. Savings" },
        ].map((stat) => (
          <GlassCard key={stat.label} className="text-center py-6">
            <p className="text-3xl md:text-4xl font-bold text-gradient">
              {stat.value}
            </p>
            <p className="text-white/60 text-sm mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="max-w-2xl mx-auto">
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            <FeatureStep
              number={1}
              title="Describe the Damage"
              description="Tell us about the damage and upload a photo. Our AI will analyze the image to understand what repairs are needed."
            />
            <FeatureStep
              number={2}
              title="Add Repair Shops"
              description="Add the phone numbers of local body shops you want to contact. You can add up to 10 shops."
            />
            <FeatureStep
              number={3}
              title="AI Calls Shops"
              description="Our AI agent calls all shops simultaneously, describes your damage professionally, and collects quotes."
            />
            <FeatureStep
              number={4}
              title="Compare & Choose"
              description="Get a detailed comparison report with prices, timeframes, and our recommendation for the best value."
            />
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Button
              asChild
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Link href="/auth/login">Get Started — It&apos;s Free</Link>
            </Button>
            <p className="text-white/40 text-xs mt-3">
              No credit card required. Only pay when you&apos;re ready to book.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Trust Indicators */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <p className="text-white/40 text-sm mb-4">Trusted Technology</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
          <span className="text-white/60">🤖 Powered by Claude AI</span>
          <span className="text-white/60">🔒 Bank-Level Security</span>
          <span className="text-white/60">📞 Real Conversations</span>
        </div>
      </div>
    </div>
  );
}
