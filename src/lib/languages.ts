export interface LanguageOption {
  code: LanguageCode;
  label: string;
  locale: string;
  nativeLabel: string;
}

export type LanguageCode = "en" | "es" | "fr" | "pt";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    locale: "es-ES",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    locale: "fr-FR",
  },
  {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    locale: "pt-BR",
  },
];

export const ENGLISH_LANGUAGE: LanguageOption = {
  code: "en",
  label: "English",
  nativeLabel: "English",
  locale: "en-US",
};

export const DEFAULT_PARTNER_LANGUAGE: LanguageCode = "es";

export function getLanguageByCode(code: LanguageCode | string): LanguageOption {
  if (code === ENGLISH_LANGUAGE.code) return ENGLISH_LANGUAGE;
  return LANGUAGE_OPTIONS.find((language) => language.code === code) ?? LANGUAGE_OPTIONS[0];
}
