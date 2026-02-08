/*

app/api/plan/generate/route.ts

Purpose:
- Server-side endpoint that the frontend calls to generate a new plan.
- Keeps the Gemini API key secure on the server and prevents it from being exposed to the client.

Endpoint: POST /api/plan/generate

Expected body (JSON):
 {
    "goalText": string,
    "targetRole"?: string,
    "hoursPerWeek"?: number,
    "timelineWeeks"?: number,
    "skillLevel"?: "beginner" | "intermediate" | "advanced"
  }
 
Response:
- { plan: Plan } on success
- { error: string } with status 4xx/5xx on failure
*/

import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/gemini";

export async function POST(request: Request) {
    try{
        /* Parse and validate the incoming request body. We can be lenient here since the frontend is in our control, but we still want to ensure we have the necessary data to generate a good plan. */
        const body = await request.json();
        
        if (!body.goalText || typeof body.goalText !== 'string') {
            return NextResponse.json(
                { error: "goalText is required and must be a string" },
                { status: 400 }
            );
        }
        
        /* Normalize skillLevel to lowercase and validate */
        const skillLevel = body.skillLevel?.toLowerCase() ?? "beginner";
        if (!["beginner", "intermediate", "advanced"].includes(skillLevel)) {
            return NextResponse.json(
                { error: `Invalid skillLevel. Must be one of: beginner, intermediate, advanced` },
                { status: 400 }
            );
        }
        
        /* Call generatePlan with defaults for missing values. Defaults keep the endpoint easy to test early. */
        const plan = await generatePlan({
            goalText: body.goalText,
            targetRole: body.targetRole,
            hoursPerWeek: body.hoursPerWeek ?? 5,
            timelineWeeks: body.timelineWeeks ?? 6,
            skilllevel: skillLevel as "beginner" | "intermediate" | "advanced",
        });
        // Return the plan JSON for the frontend to render
        return NextResponse.json({ plan });
    } catch (err: any) {
        // Log server-side for debugging. Return a friendly error message to the client.
        console.error("Error generating plan:", err);
        console.error("Error stack:", err?.stack);
        console.error("Error message:", err?.message);

        // In development, return more detailed error information
        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMessage = isDevelopment 
            ? err?.message || "Failed to generate plan. Please try again."
            : "Failed to generate plan. Please try again.";

        return NextResponse.json(
            { 
                error: errorMessage,
                ...(isDevelopment && { details: err?.toString() })
            },
            { status: 500 }
        );
    }
}