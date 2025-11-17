import translate from "@vitalets/google-translate-api";

interface TranslateTextInput {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslateTextResult {
  translatedText: string;
  detectedLanguage: string;
}

export async function translateText({
  text,
  sourceLanguage = "auto",
  targetLanguage,
}: TranslateTextInput): Promise<TranslateTextResult> {
  const response = await translate(text, {
    from: sourceLanguage,
    to: targetLanguage,
    autoCorrect: true,
  });

  return {
    translatedText: response.text,
    detectedLanguage: response.from.language.iso,
  };
}
