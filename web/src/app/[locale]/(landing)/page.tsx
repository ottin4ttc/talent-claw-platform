"use client";

import { lazy, Suspense } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Projects = lazy(() => import("@/components/landing/Projects").then((m) => ({ default: m.Projects })));
const Services = lazy(() => import("@/components/landing/Services").then((m) => ({ default: m.Services })));
const About = lazy(() => import("@/components/landing/About").then((m) => ({ default: m.About })));
const SocialProof = lazy(() => import("@/components/landing/SocialProof").then((m) => ({ default: m.SocialProof })));
const Faq = lazy(() => import("@/components/landing/Faq").then((m) => ({ default: m.Faq })));

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main id="main-content" className="lg:relative lg:z-10 flex-1 bg-background">
        <Hero />
        <Suspense>
          <Projects />
          <Services />
          <About />
          <SocialProof />
          <Faq />
        </Suspense>
      </main>
      <LandingFooter />
    </>
  );
}
