"use client";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { Projects } from "@/components/landing/Projects";
import { Services } from "@/components/landing/Services";
import { About } from "@/components/landing/About";
import { SocialProof } from "@/components/landing/SocialProof";
import { Faq } from "@/components/landing/Faq";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main id="main-content" className="lg:relative lg:z-10 flex-1 bg-background">
        <Hero />
        <Projects />
        <Services />
        <About />
        <SocialProof />
        <Faq />
      </main>
      <LandingFooter />
    </>
  );
}
