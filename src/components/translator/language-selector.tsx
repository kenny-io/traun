"use client";

import { parseAsString, useQueryState } from "nuqs";
import {
  LANGUAGE_OPTIONS,
  type LanguageCode,
  getLanguageByCode,
} from "@/lib/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  defaultLanguage: LanguageCode;
}

export function LanguageSelector({ defaultLanguage }: LanguageSelectorProps) {
  const [language, setLanguage] = useQueryState(
    "lang",
    parseAsString.withDefault(defaultLanguage),
  );

  const activeLanguage = getLanguageByCode(language);

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-muted/40 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Partner language
        </p>
        <span className="text-xs text-muted-foreground">
          {activeLanguage.nativeLabel}
        </span>
      </div>
      <Select
        value={activeLanguage.code}
        onValueChange={(value) => setLanguage(value as LanguageCode)}
      >
        <SelectTrigger aria-label="Select the language for your partner">
          <SelectValue placeholder="Pick a language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {option.nativeLabel}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        We will translate your English speech into {activeLanguage.label} and
        bring their response back to English automatically.
      </p>
    </div>
  );
}
