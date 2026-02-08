/*
POST /api/explain/week

Purpose:
- Generates explanation for a week and converts it to audio

Expected body:
{
  weekNumber: number;
  theme: string;
  milestones: Array<{ name: string; why: string; tasks: Array<{ text: string }> }>;
  goalText?: string;
}

Response:
- Audio file (MP3) on success
- { error: string } on failure
*/

import { NextResponse } from "next/server";
import { explainWeek } from "@/lib/explain-task";
import { generateMotivationalSpeech } from "@/lib/elevenlabs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.weekNumber || !body.theme) {
      return NextResponse.json(
        { error: "weekNumber and theme are required" },
        { status: 400 }
      );
    }

    // Generate explanation
    const explanation = await explainWeek({
      weekNumber: body.weekNumber,
      theme: body.theme,
      milestones: body.milestones || [],
      goalText: body.goalText,
    });

    // Convert to audio
    const audioBuffer = await generateMotivationalSpeech(explanation);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error("Week explanation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate week explanation" },
      { status: 500 }
    );
  }
}

