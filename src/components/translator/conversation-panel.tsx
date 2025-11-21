"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MicIcon, SquareIcon, Volume2Icon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ENGLISH_LANGUAGE,
  type LanguageCode,
  type LanguageOption,
  getLanguageByCode,
} from "@/lib/languages";

type ConversationSpeaker = "you" | "partner";

interface ConversationTurn {
  id: string;
  speaker: ConversationSpeaker;
  sourceLanguage: LanguageOption;
  targetLanguage: LanguageOption;
  sourceText: string;
  translatedText: string;
  timestamp: number;
}

interface ConversationPanelProps {
  partnerLanguageCode: LanguageCode;
}

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {
  length: number;
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type RecognitionConstructor = new () => RecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: RecognitionConstructor;
    SpeechRecognition?: RecognitionConstructor;
  }
}

interface StartRecognitionOptions {
  locale: string;
  speaker: ConversationSpeaker;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}

interface ProcessTranscriptOptions extends StartRecognitionOptions {
  transcript: string;
}

export function ConversationPanel({
  partnerLanguageCode,
}: ConversationPanelProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Tap speak to start the bilingual conversation.",
  );
  const [listeningFor, setListeningFor] = useState<ConversationSpeaker | "idle">(
    "idle",
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const lastUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const partnerTurnRef = useRef<() => void>();
  const partnerLanguage = useMemo(
    () => getLanguageByCode(partnerLanguageCode),
    [partnerLanguageCode],
  );

  const stopAllAudio = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (lastUtteranceRef.current) {
      lastUtteranceRef.current.onend = null;
      lastUtteranceRef.current = null;
    }
    setListeningFor("idle");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
    const synthesisAvailable = "speechSynthesis" in window;
    setIsSpeechSupported(Boolean(ctor && synthesisAvailable));
  }, []);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const createRecognition = useCallback((locale: string) => {
    if (typeof window === "undefined") return null;
    const ctor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
    if (!ctor) return null;
    const recognition = new ctor();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
  }, []);

  const speakOutLoud = useCallback(async (text: string, locale: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => {
        lastUtteranceRef.current = null;
        resolve();
      };
      lastUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const requestTranslation = useCallback(
    async (text: string, sourceLanguage: LanguageCode, targetLanguage: LanguageCode) => {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation request failed.");
      }

      const data: { translatedText: string } = await response.json();
      return data.translatedText;
    },
    [],
  );

  const handleTranscript = useCallback(
    async ({
      transcript,
      sourceLanguage,
      targetLanguage,
      speaker,
    }: ProcessTranscriptOptions) => {
      const trimmedTranscript = transcript.trim();
      setListeningFor("idle");
      if (!trimmedTranscript) {
        setStatusMessage("No speech captured. Tap speak to try again.");
        return;
      }

      setIsTranslating(true);
      setStatusMessage("Translating and speaking...");
      setErrorMessage(null);

      try {
        const translatedText = await requestTranslation(
          trimmedTranscript,
          sourceLanguage,
          targetLanguage,
        );

        const newTurn: ConversationTurn = {
          id: crypto.randomUUID(),
          speaker,
          sourceLanguage: getLanguageByCode(sourceLanguage),
          targetLanguage: getLanguageByCode(targetLanguage),
          sourceText: trimmedTranscript,
          translatedText,
          timestamp: Date.now(),
        };
        setTurns((previous) => [newTurn, ...previous].slice(0, 12));

        await speakOutLoud(
          translatedText,
          getLanguageByCode(targetLanguage).locale,
        );

        if (speaker === "you") {
          setStatusMessage(`Listening for your partner in ${partnerLanguage.label}...`);
          partnerTurnRef.current?.();
        } else {
          setStatusMessage("Translation delivered. Tap speak for your next turn.");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to translate speech.",
        );
        setStatusMessage("Something went wrong. Tap speak to try again.");
      } finally {
        setIsTranslating(false);
      }
    },
    [partnerLanguage.label, requestTranslation, speakOutLoud],
  );

  const startRecognition = useCallback(
    ({
      locale,
      speaker,
      sourceLanguage,
      targetLanguage,
    }: StartRecognitionOptions) => {
      const recognition = createRecognition(locale);
      if (!recognition) {
        setErrorMessage("Speech recognition is not supported in this browser.");
        return;
      }

      stopAllAudio();
      setListeningFor(speaker);
      setStatusMessage(
        speaker === "you"
          ? "Listening to you..."
          : `Listening to your partner in ${partnerLanguage.label}...`,
      );
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ");
        recognition.stop();
        handleTranscript({
          transcript,
          speaker,
          sourceLanguage,
          targetLanguage,
          locale,
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event);
        recognition.stop();
        setListeningFor("idle");
        
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access was blocked. Please allow permission.");
        } else if (event.error === "no-speech") {
          setErrorMessage("No speech was detected. Please try again.");
        } else if (event.error === "network") {
          setErrorMessage("Network error. Please check your internet connection.");
        } else {
          setErrorMessage(`Speech recognition failed (${event.error}).`);
        }
        
        setStatusMessage("Tap speak to try again.");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
      };

      recognition.start();
    },
    [createRecognition, handleTranscript, partnerLanguage.label, stopAllAudio],
  );

  useEffect(() => {
    partnerTurnRef.current = () =>
      startRecognition({
        locale: partnerLanguage.locale,
        speaker: "partner",
        sourceLanguage: partnerLanguage.code,
        targetLanguage: ENGLISH_LANGUAGE.code,
      });
  }, [partnerLanguage.code, partnerLanguage.locale, startRecognition]);

  const handleStartConversation = useCallback(() => {
    if (!isSpeechSupported) {
      setErrorMessage("Speech recognition and synthesis are required.");
      return;
    }
    startRecognition({
      locale: ENGLISH_LANGUAGE.locale,
      speaker: "you",
      sourceLanguage: ENGLISH_LANGUAGE.code,
      targetLanguage: partnerLanguage.code,
    });
  }, [isSpeechSupported, partnerLanguage.code, startRecognition]);

  const handleStopConversation = useCallback(() => {
    stopAllAudio();
    setStatusMessage("Conversation paused. Tap speak to resume.");
  }, [stopAllAudio]);

  const handleResetConversation = useCallback(() => {
    stopAllAudio();
    setTurns([]);
    setStatusMessage("Tap speak to start a fresh conversation.");
    setErrorMessage(null);
  }, [stopAllAudio]);

  const primaryButtonLabel = useMemo(() => {
    if (isTranslating) return "Translating...";
    if (listeningFor === "you") return "Listening to you...";
    if (listeningFor === "partner")
      return `Listening in ${partnerLanguage.label}...`;
    return "Speak";
  }, [isTranslating, listeningFor, partnerLanguage.label]);

  return (
    <Card className="bg-gradient-to-b from-background/60 to-background/90">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-2xl">Live Interpreter</CardTitle>
          <CardDescription>
            A bilingual bridge between you and your partner. Press speak, talk
            in English, and we will take care of the rest.
          </CardDescription>
          {!isSpeechSupported && (
            <p className="text-sm text-destructive">
              This demo needs a Chromium browser with Speech Recognition and
              Speech Synthesis enabled.
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-3xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
          <p>{statusMessage}</p>
          {errorMessage && (
            <p className="mt-2 text-destructive">{errorMessage}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleStartConversation}
            disabled={!isSpeechSupported || isTranslating}
            className="flex-1 min-w-[160px]"
          >
            <MicIcon className="h-4 w-4" />
            {primaryButtonLabel}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleStopConversation}
            aria-label="Stop speaking"
            disabled={listeningFor === "idle" && !isTranslating}
          >
            <SquareIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetConversation}
            aria-label="Reset conversation"
          >
            <RefreshCcwIcon className="h-5 w-5" />
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <Volume2Icon className="h-4 w-4" />
            Live transcript
          </div>
          <div className="flex flex-col gap-3">
            {turns.length === 0 && (
              <p className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Each side of the conversation will appear here with both the
                original speech and the translation.
              </p>
            )}
            {turns.map((turn) => (
              <article
                key={turn.id}
                className="rounded-3xl border border-border bg-background/80 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <span>{turn.speaker === "you" ? "You" : "Partner"}</span>
                  <span>
                    {turn.sourceLanguage.label} → {turn.targetLanguage.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-foreground">{turn.sourceText}</p>
                <p className="mt-2 rounded-2xl bg-muted/50 p-3 text-base font-semibold text-foreground">
                  {turn.translatedText}
                </p>
              </article>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
