/*
lib/auth.ts

Purpose:
- Simple authentication utilities for user sessions
- Uses cookies to store session tokens
- Validates user sessions from MongoDB
*/

import { cookies } from "next/headers";
import clientPromise, { getDbName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type User = {
  _id: string;
  email: string;
  name?: string;
  createdAt: Date;
};

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return null;
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    const sessionsCollection = db.collection("sessions");
    const usersCollection = db.collection("users");

    // Find session
    const session = await sessionsCollection.findOne({ 
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session || !session.userId) {
      return null;
    }

    // Get user
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(session.userId) 
    });

    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const client = await clientPromise;
  const db = client.db(getDbName());
  const sessionsCollection = db.collection("sessions");

  await sessionsCollection.insertOne({
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db(getDbName());
  const sessionsCollection = db.collection("sessions");

  await sessionsCollection.deleteOne({ token });
}

