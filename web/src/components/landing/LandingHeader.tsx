"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOverlay } from "@/lib/overlay-context";
import { useThemeStore } from "@/stores/themeStore";
import { ChevronUp } from "lucide-react";
import Image from "next/image";

const sections = [
  { id: "hero", label: "Home" },
  { id: "projects", label: "Evolution" },
  { id: "services", label: "Capabilities" },
  { id: "about", label: "Mission" },
  { id: "social-proof", label: "Proof" },
  { id: "contact", label: "Contact" },
];

interface DropdownItem {
  title: string;
  target: string;
}

interface NavItem {
  label: string;
  dropdown: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: "Evolution",
    dropdown: [
      { title: "Primal Era", target: "project-0" },
      { title: "Awakening", target: "project-1" },
      { title: "Tribal Age", target: "project-2" },
      { title: "Trade Age", target: "project-3" },
      { title: "Civilization", target: "project-4" },
    ],
  },
  {
    label: "More",
    dropdown: [
      { title: "Capabilities", target: "services-menu" },
      { title: "Mission", target: "about" },
      { title: "Proof", target: "social-proof" },
      { title: "FAQ", target: "faq" },
    ],
  },
];

export function LandingHeader() {
  const [, setActiveSection] = useState("Home");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showNavLogo, setShowNavLogo] = useState(false);
  const { isOverlayOpen } = useOverlay();
  const { theme } = useThemeStore();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      const isNearBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 100;
      if (isNearBottom) {
        setActiveSection("Contact");
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (!section) continue;
        if (section.id === "contact") continue;
        const element =
          document.querySelector(`.${section.id}`) ||
          document.getElementById(section.id);
        if (element) {
          const { offsetTop } = element as HTMLElement;
          if (scrollPosition >= offsetTop) {
            setActiveSection(section.label);
            return;
          }
        }
      }
      if (sections[0]) {
        setActiveSection(sections[0].label);
      }
    };

    const handleLogoVisibility = () => {
      const heroLogo = document.getElementById("hero-brand-logo");
      if (heroLogo) {
        const rect = heroLogo.getBoundingClientRect();
        setShowNavLogo(rect.bottom < 0);
      } else {
        setShowNavLogo(window.scrollY > 150);
      }
    };

    const onScroll = () => {
      handleScroll();
      handleLogoVisibility();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((target: string) => {
    const doScroll = () => {
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (target === "contact") {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
        return;
      }
      const el = document.getElementById(target);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: "smooth" });
      }
    };
    setActiveDropdown(null);
    requestAnimationFrame(doScroll);
  }, []);

  const logoSrc = mounted && theme === "dark" ? "/img/clawos-logo-dark.svg" : "/img/clawos-logo.svg";

  return (
    <AnimatePresence>
      {!isOverlayOpen && (
        <>
          <AnimatePresence>
            {activeDropdown && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => setActiveDropdown(null)}
              />
            )}
          </AnimatePresence>

          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-6 sm:bottom-10 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
          >
            <div className="pointer-events-auto inline-block">
              <div
                className="liquid-glass rounded-2xl sm:rounded-3xl overflow-hidden"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {/* Dropdown content */}
                <AnimatePresence>
                  {activeDropdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-1.5 sm:p-2">
                        {navItems
                          .find((item) => item.label === activeDropdown)
                          ?.dropdown.map((item, index) => (
                            <motion.button
                              key={item.title}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                scrollTo(item.target);
                              }}
                              className="block w-full text-left px-3 py-2 sm:px-4 sm:py-2 rounded-xl hover:bg-foreground/10 transition-colors cursor-pointer"
                            >
                              <span className="text-xs sm:text-sm font-medium text-foreground">
                                {item.title}
                              </span>
                            </motion.button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nav bar */}
                <div className="py-1.5 sm:py-2 pr-2 sm:pr-3 transition-all duration-300 ease-out" style={{ paddingLeft: showNavLogo ? 6 : 2 }}>
                  <div className="flex items-center gap-1 sm:gap-2">
                {/* Home / Logo — appears when hero logo scrolls away */}
                <button
                  onClick={() => scrollTo("top")}
                  className="flex items-center justify-center h-8 sm:h-10 overflow-hidden transition-all duration-300 ease-out"
                  aria-label="Home"
                  style={{
                    width: showNavLogo ? 80 : 0,
                    opacity: showNavLogo ? 1 : 0,
                    paddingInline: showNavLogo ? 4 : 0,
                    pointerEvents: showNavLogo ? "auto" : "none",
                  }}
                >
                  <Image
                    src={logoSrc}
                    alt="ClawOS"
                    width={100}
                    height={18}
                    className="h-4 sm:h-5 w-auto shrink-0"
                  />
                </button>

                    {/* Dropdown triggers */}
                    {navItems.map((item) => (
                      <div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => setActiveDropdown(item.label)}
                      >
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === item.label ? null : item.label
                            )
                          }
                          className={`flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                            activeDropdown === item.label
                              ? "bg-foreground/15 text-foreground"
                              : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          {item.label}
                          <motion.div
                            animate={{ rotate: activeDropdown === item.label ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </motion.div>
                        </button>
                      </div>
                    ))}

                    {/* CTA */}
                    <button
                      onClick={() => scrollTo("contact")}
                      className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-foreground text-background text-sm sm:text-base font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
