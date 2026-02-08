/*
POST /api/auth/signup

Purpose:
- Creates a new user account
- Returns a session token

Expected body:
{
  email: string;
  password: string;
  name?: string;
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
    const name = body.name ? String(body.name).trim() : undefined;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Simple password hashing (for production, use bcrypt)
    // For hackathon, we'll use a simple approach
    const passwordHash = Buffer.from(password).toString("base64");

    // Create user
    const now = new Date();
    const result = await usersCollection.insertOne({
      email,
      passwordHash,
      name,
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();
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
        email,
        name,
        createdAt: now,
      },
      sessionToken,
    });
  } catch (err: any) {
    console.error("SIGNUP error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

