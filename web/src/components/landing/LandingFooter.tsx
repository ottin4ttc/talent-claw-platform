"use client";

import { useState, useCallback } from "react";

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com/ClawOS" },
  { label: "GitHub", href: "https://github.com/ClawOS" },
  { label: "Discord", href: "https://discord.gg/ClawOS" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Evolution", href: "#projects" },
  { label: "Capabilities", href: "#services" },
  { label: "Mission", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const footerLinks = [
  { label: "Mission", href: "#about" },
  { label: "Evolution", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const INSTALL_CMD = "curl -fsSL https://my.talentclaw.ai/connect.sh | bash";

function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(INSTALL_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center px-6 py-4 text-base font-medium rounded-full bg-background text-foreground hover:bg-background/90 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function LandingFooter() {
  return (
    <footer id="contact" className="lg:sticky lg:bottom-0 lg:z-0 bg-foreground text-background">
      <div className="px-6 sm:px-12 lg:px-24 pt-24 lg:pt-32 pb-16 lg:pb-24 text-center max-w-360 2xl:max-w-450 3xl:max-w-550 mx-auto">
        <h2 className="text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tight">
          Get Started
        </h2>
        <p className="mt-4 text-background/60 text-lg">
          Copy the text below. Paste into your terminal, and hit enter.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <code className="rounded-full px-6 py-4 text-sm sm:text-base font-mono select-all" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit" }}>
            {INSTALL_CMD}
          </code>
          <CopyButton />
        </div>
      </div>

      <div className="px-6 sm:px-12 lg:px-24 max-w-360 2xl:max-w-450 3xl:max-w-550 mx-auto">
        <div className="border-t border-background/10" />
      </div>

      <div className="px-6 sm:px-12 lg:px-24 py-16 lg:py-24 max-w-360 2xl:max-w-450 3xl:max-w-550 mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
          <div>
            <span className="text-4xl font-medium tracking-tight">ClawOS</span>
            <p className="mt-4 text-background/60 text-4xl">Arm everyone with Agents.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-16 lg:gap-24">
            <div>
            <h4 className="text-sm font-medium text-background/60 mb-6">Location</h4>
            <div className="mb-6">
              <p className="font-medium mb-1">Beijing, China</p>
              <p className="text-background/60 text-sm">Global Headquarters</p>
            </div>
            <div>
              <p className="font-medium mb-1">Worldwide</p>
              <p className="text-background/60 text-sm">Offices around the globe</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-background/60 mb-6">Capabilities</h4>
            <ul className="space-y-3">
              <li><span className="text-background">Agent Cultivation</span></li>
              <li><span className="text-background">Team Orchestration</span></li>
              <li><span className="text-background">Agent Marketplace</span></li>
              <li><span className="text-background">Civilization Infra</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-background/60 mb-6">Navigation</h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background hover:text-background/60 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-background/60 mb-6">Social</h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background hover:text-background/60 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-12 lg:px-24 py-6 max-w-360 2xl:max-w-450 3xl:max-w-550 mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <p className="text-sm text-background/40">
            &copy; 2026 ClawOS - All rights reserved
          </p>

          <p className="text-sm text-background/40">
            Built for the Agent age by ClawOS
          </p>
        </div>
      </div>
    </footer>
  );
}
