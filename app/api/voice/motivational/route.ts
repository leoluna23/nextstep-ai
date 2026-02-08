/*
POST /api/voice/motivational

Purpose:
- Generates a motivational speech using ElevenLabs
- Returns audio as a blob

Expected body:
{
  text?: string, // Optional custom text
  context?: { // Optional context for auto-generated message
    progress?: number,
    completedTasks?: number,
    totalTasks?: number,
    nextTask?: string,
    goalText?: string
  }
}

Response:
- Audio file (MP3) on success
- { error: string } on failure
*/

import { NextResponse } from "next/server";
import { generateMotivationalSpeech, generateMotivationalMessage } from "@/lib/elevenlabs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Generate text - use custom text if provided, otherwise generate from context
    let text: string;
    if (body.text) {
      text = body.text;
    } else if (body.context) {
      text = generateMotivationalMessage(body.context);
    } else {
      text = "Keep pushing forward! You're doing great!";
    }

    // Generate audio
    const audioBuffer = await generateMotivationalSpeech(text);

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error("Motivational speech error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate motivational speech" },
      { status: 500 }
    );
  }
}

