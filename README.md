## Traun · Real-time Conversational Translator

Traun is a mobile-first Next.js App Router experience that behaves like a human interpreter between two people. Press *Speak* to talk in English, Traun speaks the translation out loud (Spanish, French, or Portuguese), then instantly listens for the reply and delivers it back to you in spoken English.

https://github.com/your-org/traun/assets/demo.gif *(placeholder for demo clip)*

### Tech Stack
- Next.js 15 App Router (React Server Components by default)
- Tailwind CSS + Shadcn UI building blocks (Radix primitives)
- `nuqs` for URL search param state (language selection)
- Web Speech API (browser-based speech recognition + synthesis)
- `@vitalets/google-translate-api` for server-side translations (no API key required)

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a Chromium-based browser (Chrome, Edge, Arc). Accept the microphone prompt so speech recognition can start.

### Production build

```bash
npm run build
npm start
```

---

## Using the App

1. Pick the partner language from the selector (Spanish, French, or Portuguese). The choice is synced to `?lang=` via `nuqs`, so it is shareable and survives refreshes.
2. Tap **Speak**, talk naturally in English, then pause. Traun transcribes, sends the text to `/api/translate`, and speaks the partner’s language out loud.
3. As soon as your translation is played, Traun automatically listens for the other person in their language, translates back to English, and speaks the answer to you.
4. All turns (original + translated text) are logged in the live transcript so you can scroll if you missed something.

Use the square icon to pause/cancel any ongoing recognition or speech, and the refresh icon to clear the transcript.

---

## Architecture Notes

- **Server components first:** The landing layout, hero copy, and layout wrappers render on the server. Only the selector and interpreter console opt into `"use client"` because they need browser APIs.
- **Speech bridge:** `ConversationPanel` orchestrates recognition → translation → text-to-speech loops. It guards availability, handles fallbacks, and keeps the UI responsive with status chips.
- **Translation API:** `/api/translate` validates payloads with `zod` and calls `@vitalets/google-translate-api`. This keeps API secrets out of the client and enables per-turn observability in logs.
- **Styling:** Tailwind tokens are mapped to CSS variables so Shadcn UI primitives (buttons, cards, select) stay consistent while allowing the glassy mobile aesthetic.

---

## Browser Compatibility

- Works best in Chrome 113+ or Edge 113+ (SpeechRecognition + SpeechSynthesis enabled by default).
- Safari currently lacks the necessary Web Speech APIs for full duplex operation.
- Ensure your device volume is audible; Traun uses the system speech synthesis voices for each locale.

---

## Future Enhancements

- Persist turns securely (Supabase/Edge DB) for after-call summaries.
- Support streaming models (OpenAI Realtime / Vercel VLM) for lower latency.
- Add haptic cues and vibration feedback on mobile handsets.
- Allow headset routing and noise suppression controls.
