"use client";

import { OverlayProvider } from "@/lib/overlay-context";
import { ReducedMotionProvider } from "@/lib/motion";
import { SmoothScroll } from "@/components/landing/SmoothScroll";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionProvider>
      <OverlayProvider>
        <div className="landing">
          <SmoothScroll>{children}</SmoothScroll>
        </div>
      </OverlayProvider>
    </ReducedMotionProvider>
  );
}
