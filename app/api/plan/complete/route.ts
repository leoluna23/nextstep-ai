/**
 * POST /api/plan/complete
 *
 * Purpose:
 * - Toggles completion of a taskId for a specific plan in MongoDB.
 * - Returns updated completion list (source of truth).
 *
 * Expected body:
 * { planId: string, taskId: string }
 *
 * Response:
 * { completedTaskIds: string[] }
 */

import { NextResponse } from "next/server";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const planId = String(body.planId ?? "").trim();
    const taskId = String(body.taskId ?? "").trim();

    if (!planId || !taskId) {
      return NextResponse.json({ error: "planId and taskId are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const collection = db.collection("plans");

    const _id = new ObjectId(planId);

    // Build query - verify user owns the plan if logged in
    const query: any = { _id };
    if (user) {
      query.userId = user._id;
    }

    const existing = await collection.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const current: string[] = existing.completedTaskIds ?? [];
    const has = current.includes(taskId);

    const next = has ? current.filter((x) => x !== taskId) : [...current, taskId];

    await collection.updateOne(
      { _id },
      {
        $set: { completedTaskIds: next, updatedAt: new Date() },
      }
    );

    return NextResponse.json({ completedTaskIds: next }, { status: 200 });
  } catch (err: any) {
    console.error("COMPLETE error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update completion" }, { status: 500 });
  }
}
