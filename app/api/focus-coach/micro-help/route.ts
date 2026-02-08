/*
POST /api/focus-coach/micro-help

Purpose:
- Generates micro-help when user is stuck on a task

Expected body:
{
  taskText: string;
  taskMinutes: number;
  goalText?: string;
}

Response:
{
  smallerStep: string;
  threeMinuteVersion: string;
}
*/

import { NextResponse } from "next/server";
import { generateMicroHelp } from "@/lib/focus-coach";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.taskText) {
      return NextResponse.json(
        { error: "taskText is required" },
        { status: 400 }
      );
    }

    const result = await generateMicroHelp({
      taskText: body.taskText,
      taskMinutes: body.taskMinutes || 30,
      goalText: body.goalText,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Micro-help error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate micro-help" },
      { status: 500 }
    );
  }
}

