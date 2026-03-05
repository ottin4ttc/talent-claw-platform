"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const next = locale === "en" ? "zh" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
    >
      {locale === "en" ? "中" : "EN"}
    </Button>
  );
}
