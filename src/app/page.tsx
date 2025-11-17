import { Suspense } from "react";
import { ConversationPanel } from "@/components/translator/conversation-panel";
import { LanguageSelector } from "@/components/translator/language-selector";
import {
  DEFAULT_PARTNER_LANGUAGE,
  LANGUAGE_OPTIONS,
  type LanguageCode,
  getLanguageByCode,
} from "@/lib/languages";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const partnerLanguageCode = (
    params?.lang as LanguageCode | undefined
  ) ?? DEFAULT_PARTNER_LANGUAGE;
  const partnerLanguage = getLanguageByCode(partnerLanguageCode);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:py-12 md:gap-8 md:px-8">
        <header className="space-y-4 rounded-4xl bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
            Traun · Real-time interpreter
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Speak freely. We will carry every word between English and{" "}
            <span className="text-emerald-300">{partnerLanguage.label}</span>.
          </h1>
          <p className="text-base text-slate-200 sm:max-w-3xl">
            Tap the microphone, speak naturally, and let Traun interpret the
            conversation both ways. Designed for face-to-face chats in cafés,
            boardrooms, or travel moments when a human translator would normally
            sit between you and your partner.
          </p>
        </header>

        <main className="grid gap-6 md:grid-cols-[1.4fr_0.8fr]">
          <ConversationPanel partnerLanguageCode={partnerLanguage.code} />
          <aside className="space-y-6 rounded-4xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <Suspense
              fallback={
                <div className="h-40 animate-pulse rounded-3xl bg-white/10" />
              }
            >
              <LanguageSelector defaultLanguage={partnerLanguage.code} />
            </Suspense>
            <section className="space-y-3 text-sm text-slate-200">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                How it works
              </h2>
              <ol className="space-y-2 text-sm leading-relaxed text-slate-100">
                <li>1. Tap Speak and talk in English.</li>
                <li>2. We translate and speak it out to your partner.</li>
                <li>3. We immediately listen for their answer.</li>
                <li>4. Their reply returns in spoken English.</li>
              </ol>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                Supported partner languages:{" "}
                {LANGUAGE_OPTIONS.map((language, index) => (
                  <span key={language.code}>
                    {language.label}
                    {index < LANGUAGE_OPTIONS.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
