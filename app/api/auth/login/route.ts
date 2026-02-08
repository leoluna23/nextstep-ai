/*
POST /api/auth/login

Purpose:
- Authenticates a user and creates a session

Expected body:
{
  email: string;
  password: string;
}

Response:
{
  user: User,
  sessionToken: string
}
*/

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password (simple base64 for hackathon)
    const passwordHash = Buffer.from(password).toString("base64");
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id.toString();
    const sessionToken = await createSession(userId);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({
      user: {
        _id: userId,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      sessionToken,
    });
  } catch (err: any) {
    console.error("LOGIN error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to login" },
      { status: 500 }
    );
  }
}

