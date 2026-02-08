/*
POST /api/explain/task

Purpose:
- Generates explanation for a task and converts it to audio

Expected body:
{
  taskText: string;
  taskMinutes: number;
  category: string;
  successCriteria: string;
  goalText?: string;
  milestoneName?: string;
  weekNumber?: number;
}

Response:
- Audio file (MP3) on success
- { error: string } on failure
*/

import { NextResponse } from "next/server";
import { explainTask } from "@/lib/explain-task";
import { generateMotivationalSpeech } from "@/lib/elevenlabs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.taskText) {
      return NextResponse.json(
        { error: "taskText is required" },
        { status: 400 }
      );
    }

    // Generate explanation
    const explanation = await explainTask({
      taskText: body.taskText,
      taskMinutes: body.taskMinutes || 30,
      category: body.category || "build",
      successCriteria: body.successCriteria || "Task completed",
      goalText: body.goalText,
      milestoneName: body.milestoneName,
      weekNumber: body.weekNumber,
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
    console.error("Task explanation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate task explanation" },
      { status: 500 }
    );
  }
}

