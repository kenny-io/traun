import { NextResponse } from "next/server";
import { z } from "zod";
import { translateText } from "@/lib/translator";

const payloadSchema = z.object({
  text: z.string().trim().min(1, "Say something before translating."),
  sourceLanguage: z.string().trim().min(2).max(5).optional(),
  targetLanguage: z.enum(["en", "es", "fr", "pt"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const translation = await translateText(payload);

    return NextResponse.json(translation, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request payload.", issues: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Translation error", error);
    return NextResponse.json(
      { message: "Something went wrong while translating." },
      { status: 500 },
    );
  }
}
