"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function SplitText({ children }: { children: string }) {
  return (
    <>
      {children.split(" ").map((word, wi, arr) => (
        <span key={wi} className="word inline-block whitespace-nowrap">
          {word}{wi < arr.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  );
}

const services = [
  { id: 1, title: "Agent Cultivation" },
  { id: 2, title: "Team Orchestration" },
  { id: 3, title: "Agent Marketplace" },
  { id: 4, title: "Civilization Infrastructure" },
];

function ServiceItem({ title, index }: { title: string; index: number }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayInnerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  useEffect(() => {
    if (!itemRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemRef.current,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: itemRef.current,
            start: "top 90%",
            end: "top 70%",
            scrub: 1,
          },
        }
      );
    }, itemRef);

    return () => ctx.revert();
  }, [index]);

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !overlayRef.current || !overlayInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(overlayRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(overlayInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([overlayRef.current, overlayInnerRef.current], { y: "0%" }, 0);

    if (wordsRef.current.length > 0) {
      tl.fromTo(
        wordsRef.current,
        { y: 0 },
        {
          y: -32,
          duration: 0.15,
          ease: "sine.out",
          stagger: { each: 0.03, from: "start" },
        },
        0
      ).to(
        wordsRef.current,
        {
          y: 0,
          duration: 0.2,
          ease: "sine.inOut",
          stagger: { each: 0.03, from: "start" },
        },
        0.15
      );
    }
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !overlayRef.current || !overlayInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    gsap.set(wordsRef.current, { y: 0 });

    gsap
      .timeline({ defaults: animationDefaults })
      .to(overlayRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(overlayInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const words = title.split(" ").map((word, i, arr) => (
    <span
      key={i}
      ref={(el) => {
        if (el) wordsRef.current[i] = el;
      }}
      className="inline-block"
    >
      {word}{i < arr.length - 1 ? "\u00A0" : ""}
    </span>
  ));

  return (
    <div
      ref={itemRef}
      className="relative overflow-hidden border-t border-foreground/10"
    >
      <a
        href="#"
        className="flex items-center justify-between cursor-pointer px-6 py-8 sm:px-12 md:py-10 lg:px-24"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-[clamp(1.5rem,4vw,4rem)] font-light tracking-tight text-foreground">
          {title}
        </span>
      </a>

      <div
        ref={overlayRef}
        className="absolute inset-0 overflow-hidden pointer-events-none bg-foreground"
        style={{ transform: "translateY(101%)" }}
      >
        <div
          ref={overlayInnerRef}
          className="flex items-center justify-between h-full px-6 sm:px-12 lg:px-24"
          style={{ transform: "translateY(-101%)" }}
        >
          <span className="text-[clamp(1.5rem,4vw,4rem)] font-light tracking-tight text-background">
            {words}
          </span>
          <svg
            className="w-8 h-8 md:w-12 md:h-12 text-background"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 17L17 7M17 7H7M17 7V17"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current || !sectionRef.current || !contentRef.current) return;

    const title = titleRef.current;
    const words = title.querySelectorAll(".word");
    const section = sectionRef.current;
    const content = contentRef.current;

    const anim = gsap.fromTo(
      words,
      {
        willChange: "transform",
        transformOrigin: "50% 100%",
        scaleY: 0,
      },
      {
        ease: "power3.in",
        opacity: 1,
        scaleY: 1,
        stagger: 0.12,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=80%",
          scrub: true,
          pin: content,
          anticipatePin: 1,
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="services relative bg-background overflow-hidden"
    >
      <div
        ref={contentRef}
        className="flex min-h-screen items-center justify-center px-6 sm:px-12 lg:px-24"
      >
        <h2
          ref={titleRef}
          className="text-center text-[clamp(2.5rem,7vw,7rem)] font-medium leading-[1.1] tracking-tight text-foreground max-w-350"
        >
          <SplitText>We arm every person with the power of Agents.</SplitText>
        </h2>
      </div>

      <div id="services-menu" className="w-full pb-24">
        <div className="w-full">
          {services.map((service, index) => (
            <ServiceItem key={service.id} title={service.title} index={index} />
          ))}
          <div className="border-t border-foreground/10" />
        </div>
      </div>
    </section>
  );
}
