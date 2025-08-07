// app/api/tts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json();

  if (!text || !voiceId) {
    return NextResponse.json({ error: "Text and voiceId are required" }, { status: 400 });
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  try {
    const audioStream = await client.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_flash_v2_5", // Chọn model phù hợp
    });

    // Tạo một ReadableStream để trả về cho client
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of audioStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });

  } catch (error) {
    console.error("ElevenLabs API error:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}