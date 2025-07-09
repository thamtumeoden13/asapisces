// File: app/api/deepgram/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

export async function GET() {
  // 1. Lấy Project ID của bạn từ dashboard Deepgram
  const projectId = "8beef9ae-cf6a-4216-8468-9225553e8918"; // Đây là ID từ ảnh của bạn
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  console.log("deepgramApiKey:", deepgramApiKey);

  if (!deepgramApiKey) {
    console.error("DEEPGRAM_API_KEY is not set on the server.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // Khởi tạo client ở phía server
  const deepgram = createClient(deepgramApiKey);

  console.log("Deepgram client initialized successfully.", deepgram);

  try {
    // Tạo một key tạm thời
   
    const { result, error } = await deepgram.manage.createProjectKey(projectId, {
      comment: "Temporary key for client session",
      scopes: ["member"],
      timeToLiveInSeconds: 60 * 5 // 5 phút
    });


    if (error) {
      console.error("Deepgram key creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trả về key tạm thời cho client
    return NextResponse.json({ deepgramToken: result.key }); // Chỉ trả về chuỗi key

  } catch (error) {
    console.warn("FULL Error object when creating Deepgram key:", error);
    return NextResponse.json({ error: "Could not create temporary key" }, { status: 500 });
  }
}