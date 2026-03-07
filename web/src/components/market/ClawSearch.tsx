"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ClawSearchProps {
  onSearch: (q: string) => void;
  onTagClick: (tag: string) => void;
}

const HOT_TAGS = ["nlp", "translation", "data", "security", "code", "chat"];

export function ClawSearch({ onSearch, onTagClick }: ClawSearchProps) {
  const t = useTranslations("market");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
          className="h-11 pl-10 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {HOT_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs text-primary/80 transition-all hover:bg-primary/15 hover:border-primary/30 active:scale-95"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
