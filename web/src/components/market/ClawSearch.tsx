"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ClawSearchProps {
  onSearch: (q: string) => void;
  onTagClick: (tag: string) => void;
}

const HOT_TAGS = ["nlp", "translation", "data", "security"];

export function ClawSearch({ onSearch, onTagClick }: ClawSearchProps) {
  const t = useTranslations("market");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => onSearch(query)}>{t("loadMore")}</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {HOT_TAGS.map((tag) => (
          <Button key={tag} variant="outline" size="sm" onClick={() => onTagClick(tag)}>
            #{tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
