/*
POST /api/auth/logout

Purpose:
- Logs out the current user by deleting their session
*/

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, deleteSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear cookie
    cookieStore.delete("session_token");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("LOGOUT error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to logout" },
      { status: 500 }
    );
  }
}

