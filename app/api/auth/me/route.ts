/*
GET /api/auth/me

Purpose:
- Returns the current authenticated user
*/

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error("ME error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to get user" },
      { status: 500 }
    );
  }
}

