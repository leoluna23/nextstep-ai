/*
POST /api/plan/archive

Purpose:
- Archives or unarchives a plan

Expected body:
{
  planId: string;
  archived: boolean; // true to archive, false to unarchive
}

Response:
{
  success: boolean;
  archived: boolean;
}
*/

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const planId = String(body.planId ?? "").trim();
    const archived = Boolean(body.archived);

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const collection = db.collection("plans");

    // Verify user owns the plan
    const _id = new ObjectId(planId);
    const existing = await collection.findOne({ 
      _id,
      userId: user._id 
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Update archive status
    if (archived) {
      await collection.updateOne(
        { _id, userId: user._id },
        { 
          $set: { 
            archived: true,
            archivedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      );
    } else {
      await collection.updateOne(
        { _id, userId: user._id },
        { 
          $set: { 
            archived: false,
            updatedAt: new Date()
          },
          $unset: { archivedAt: "" }
        }
      );
    }

    return NextResponse.json({ 
      success: true,
      archived 
    }, { status: 200 });
  } catch (err: any) {
    console.error("ARCHIVE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to archive plan" },
      { status: 500 }
    );
  }
}

