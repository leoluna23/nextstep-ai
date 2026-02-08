/*
GET /api/plan/list

Purpose:
- Lists all plans for the current authenticated user
- Returns plans sorted by most recent first

Response:
{
  plans: Array<{
    _id: string;
    goalText: string;
    plan: { title: string; summary: string };
    createdAt: Date;
    updatedAt: Date;
    completedTaskIds: string[];
  }>
}
*/

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const collection = db.collection("plans");

    // Find all plans for this user
    const plans = await collection
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .toArray();

    const formattedPlans = plans.map((plan: any) => ({
      _id: plan._id.toString(),
      goalText: plan.goalText,
      targetRole: plan.targetRole,
      plan: {
        title: plan.plan?.title || "Untitled Plan",
        summary: plan.plan?.summary || "",
      },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      completedTaskIds: plan.completedTaskIds || [],
      totalTasks: plan.plan?.weeks?.reduce((acc: number, w: any) => 
        acc + w.milestones?.reduce((acc2: number, m: any) => 
          acc2 + (m.tasks?.length || 0), 0), 0) || 0,
      archived: plan.archived || false,
      archivedAt: plan.archivedAt,
    }));

    return NextResponse.json({ plans: formattedPlans }, { status: 200 });
  } catch (err: any) {
    console.error("LIST PLANS error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to list plans" },
      { status: 500 }
    );
  }
}

