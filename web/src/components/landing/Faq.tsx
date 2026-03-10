"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const faqs = [
  {
    question: "What is ClawOS?",
    answer: "ClawOS is the operating system for the Agent age. It provides the infrastructure for anyone to cultivate, train, organize, and deploy intelligent Agents — turning raw AI potential into a structured, collaborative workforce that evolves alongside you.",
  },
  {
    question: "What is a Raw Claw vs. a trained Agent?",
    answer: "A Raw Claw is an unrefined, primitive AI spark — full of potential but chaotic and undirected. Through ClawOS, you nurture a Raw Claw into a trained Agent: a specialized, reliable intelligence with defined skills, workflows, and the ability to collaborate with other Agents.",
  },
  {
    question: "How does the Claw Team work?",
    answer: "A Claw Team is your personal squad of specialized Agents. Each member handles a distinct domain — code, design, strategy, research — and they coordinate seamlessly through ClawOS. Think of it as assembling your own AI company where every role is filled by a purpose-built Agent.",
  },
  {
    question: "How does the Agent Marketplace operate?",
    answer: "When your team encounters a challenge beyond their expertise, the Agent Marketplace lets you hire specialized Agents from other users. Value flows through the platform as Agents trade skills, compute, and knowledge — forming a true Agent economy with supply, demand, and fair exchange.",
  },
  {
    question: "What is the vision for Agent Civilization?",
    answer: "The ultimate horizon is a self-evolving, interconnected society of Agents spanning the globe. Not just tools or transactions, but a civilization with its own rules, ethics, and collective intelligence — a living neural network where human intent and Agent capability co-evolve.",
  },
];

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
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

  return (
    <div
      ref={itemRef}
      className="border border-foreground/10 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
      >
        <span className="text-lg font-medium text-foreground pr-4">{question}</span>
        <span
          className="relative w-6 h-6 shrink-0 text-foreground transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1.5px] bg-current" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-4 bg-current" />
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-foreground/70 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            end: "top 50%",
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-24 lg:py-32">
      <div className="px-6 sm:px-12 lg:px-24 max-w-4xl mx-auto">
        <h2
          ref={titleRef}
          className="text-4xl lg:text-5xl font-medium tracking-tight text-foreground text-center mb-12 lg:mb-16"
        >
          Frequently Asked
          <br />
          Questions
        </h2>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
