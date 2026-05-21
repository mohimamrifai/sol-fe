import { Hero } from "@/components/hero";
import { LandingTrusted } from "@/components/landing-trusted";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingServices } from "@/components/landing-services";
import { LandingFeatures } from "@/components/landing-features";
import { LandingTrackingCta } from "@/components/landing-tracking-cta";
import { LandingWhy } from "@/components/landing-why";
import { LandingStats } from "@/components/landing-stats";
import { LandingTestimonials } from "@/components/landing-testimonials";
import { LandingEstimateCta } from "@/components/landing-estimate-cta";
import { LandingFaq } from "@/components/landing-faq";
import { LandingCtaFinal } from "@/components/landing-cta-final";
import { LandingFooter } from "@/components/landing-footer";

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
