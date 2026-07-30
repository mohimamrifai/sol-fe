import { Hero } from "@/components/homepage/hero";
import { LandingTrusted } from "@/components/homepage/landing-trusted";
import { LandingHowItWorks } from "@/components/homepage/landing-how-it-works";
import { LandingServices } from "@/components/homepage/landing-services";
import { LandingFeatures } from "@/components/homepage/landing-features";
import { LandingTrackingCta } from "@/components/homepage/landing-tracking-cta";
import { LandingWhy } from "@/components/homepage/landing-why";
import { LandingStats } from "@/components/homepage/landing-stats";
import { LandingTestimonials } from "@/components/homepage/landing-testimonials";
import { LandingEstimateCta } from "@/components/homepage/landing-estimate-cta";
import { LandingFaq } from "@/components/homepage/landing-faq";
import { LandingCtaFinal } from "@/components/homepage/landing-cta-final";
import { LandingFooter } from "@/components/homepage/landing-footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <LandingTrusted />
      <LandingHowItWorks />
      <LandingServices />
      <LandingFeatures />
      <LandingTrackingCta />
      <LandingWhy />
      <LandingStats />
      <LandingTestimonials />
      <LandingEstimateCta />
      <LandingFaq />
      <LandingCtaFinal />
      <LandingFooter />
    </main>
  );
}
