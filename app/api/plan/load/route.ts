/**
 * GET /api/plan/load?id=PLAN_ID
 *
 * Purpose:
 * - Loads a saved plan from MongoDB by its planId.
 *
 * Response:
 * {
 *   planDoc: {
 *     plan: Plan,
 *     completedTaskIds: string[],
 *     ...metadata
 *   }
 * }
 */

import { NextResponse } from "next/server";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const client = await clientPromise;
    const db = client.db(getDbName());
    const collection = db.collection("plans");

    // Build query - if user is logged in, only show their plans, otherwise allow access (for backwards compatibility)
    const query: any = { _id: new ObjectId(id) };
    if (user) {
      query.userId = user._id;
    }

    const doc = await collection.findOne(query);

    if (!doc) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Convert _id to string for client
    const planDoc = {
      ...doc,
      _id: doc._id.toString(),
    };

    return NextResponse.json({ planDoc }, { status: 200 });
  } catch (err: any) {
    console.error("LOAD error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load plan" }, { status: 500 });
  }
}
