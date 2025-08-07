// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { OpenAI } from "openai";
import { Readable } from "stream";

export const runtime = "edge"; // hoặc "nodejs" nếu Google Cloud yêu cầu Node

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const gcloudTTS = new TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, provider = "openai", voice = "alloy" } = body;

  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  try {
    if (provider === "openai") {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        input: text,
        voice: voice, // alloy, nova, shimmer, echo...
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    if (provider === "google") {
      const [result] = await gcloudTTS.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: "en-US",
          name: "en-US-Wavenet-D", // Hoặc các giọng khác
        },
        audioConfig: {
          audioEncoding: "MP3",
        },
      });

      const audioContent = result.audioContent!;
      const buffer = Buffer.from(audioContent, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
