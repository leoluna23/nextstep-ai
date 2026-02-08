/*
POST /api/plan/save

Purpose:
- Saves a generated plan document into MongoDB
- Returns a planId that the frontend uses in the URL to load the plan

Expected body: (JSON)
{
    goalText: string;
    targetRole?: string;
    hoursPerWeek: number;
    timelineWeeks: number;
    skillLevel: "Beginner" | "Intermediate" | "Advanced";
    plan: Plan;
}

Response:
- { planId: string } on success
*/

import { NextResponse } from "next/server";
import clientPromise, { getDbName } from "@/lib/mongodb";
import type { PlanDoc } from "@/models/PlanDoc";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request){
    try{
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();

        const goalText = String(body.goalText ?? "").trim();
        const targetRole = body.targetRole ? String(body.targetRole).trim() : undefined;

        const hoursPerWeek = Number(body.hoursPerWeek ?? 5);
        const timelineWeeks = Number(body.timelineWeeks ?? 6);
        const skillLevel = body.skillLevel as PlanDoc["skillLevel"];

        const plan = body.plan; // already validated when generated, but we could add extra checks here if desired.

        if (!goalText) {
            return NextResponse.json({ error: "goalText is required" }, { status: 400 });
        }
        if (!plan){
            return NextResponse.json({ error: "plan is required" }, { status: 400 });
        }

        const client = await clientPromise; // Get the MongoDB client from our connection helper. This uses a global cached client for efficiency in serverless environments.
        const db = client.db(getDbName()); // Get the database instance. The getDbName function allows us to easily switch databases based on environment (e.g. development vs production).
        const collection = db.collection<PlanDoc>("plans");  // Get the "plans" collection, which will store our generated plans. The generic <PlanDoc> helps with TypeScript type checking for our documents.

        const now = new Date();

        // Create the document to insert. We store both the plan and the completion state together for simplicity. The frontend will update the completedTaskIds as the user marks tasks complete.
        const doc: PlanDoc = {
            createdAt: now,
            updatedAt: now,
            userId: user._id, // Associate plan with user
            goalText,
            targetRole,
            hoursPerWeek,
            timelineWeeks,
            skillLevel: (skillLevel === "Beginner" || skillLevel === "Intermediate" || skillLevel === "Advanced") 
            ? skillLevel 
            : "Beginner",
            plan,
            completedTaskIds: [],
        };

        const result = await collection.insertOne(doc);
        return NextResponse.json({ planId: result.insertedId.toString() }, { status: 200 });
    
    } catch (err: any) {
        console.error("SAVE error:", err);
        return NextResponse.json({error: err?.message || "Failed to save plan. Please try again."}, { status: 500 });
    }
}