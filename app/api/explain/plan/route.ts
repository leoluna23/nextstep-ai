/*
POST /api/explain/plan

Purpose:
- Generates explanation for the overall plan and converts it to audio

Expected body:
{
  title: string;
  summary: string;
  goalText: string;
  totalWeeks: number;
  totalTasks: number;
}

Response:
- Audio file (MP3) on success
- { error: string } on failure
*/

import { NextResponse } from "next/server";
import { explainPlan } from "@/lib/explain-task";
import { generateMotivationalSpeech } from "@/lib/elevenlabs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.title || !body.summary) {
      return NextResponse.json(
        { error: "title and summary are required" },
        { status: 400 }
      );
    }

    // Generate explanation
    const explanation = await explainPlan({
      title: body.title,
      summary: body.summary,
      goalText: body.goalText || "",
      totalWeeks: body.totalWeeks || 0,
      totalTasks: body.totalTasks || 0,
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
    console.error("Plan explanation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate plan explanation" },
      { status: 500 }
    );
  }
}

