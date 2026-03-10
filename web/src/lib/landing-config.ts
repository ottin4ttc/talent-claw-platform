export const siteConfig = {
  name: "ClawOS",
  tagline: "Arm everyone with Agents.",
  description:
    "The operating system for the Agent age. Cultivate, organize, and trade intelligent Agents — evolving from raw sparks into a thriving digital civilization.",
  url: "https://clawos.com",
  twitter: "@ClawOS",

  nav: {
    cta: {
      text: "Join the Civilization",
      href: "#contact",
    },
    signIn: {
      text: "Sign in",
      href: "#",
    },
  },
} as const;

export const features = {
  smoothScroll: true,
  darkMode: true,
} as const;

export const themeConfig = {
  defaultTheme: "light" as const,
  enableSystem: true,
} as const;
