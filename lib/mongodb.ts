/*
lib/mongodb.ts

Purpose:
- Provides a cached MongoDB client connection for Next.js server routes.
- Prevents creating a new connection on every request, which can lead to performance issues and hitting connection limits.

How it works:
- In development, Next.js can reload modules often. We store the client promise on globalThis.
- In production, module scope is stable, and works safely.
*/

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set. Please add it to your .env.local file.");
}

// Configure MongoDB client options with proper SSL/TLS settings
// Check if the URI indicates SSL/TLS is needed (MongoDB Atlas uses mongodb+srv://)
const isAtlasConnection = uri.startsWith("mongodb+srv://") || uri.includes("ssl=true") || uri.includes("tls=true");

const options: {
    tls?: boolean;
    tlsAllowInvalidCertificates?: boolean;
    tlsAllowInvalidHostnames?: boolean;
    serverSelectionTimeoutMS?: number;
    connectTimeoutMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
} = {
    // Enable TLS/SSL for MongoDB Atlas connections
    // If using mongodb+srv://, TLS is automatically enabled
    // For regular mongodb:// connections, only enable if explicitly needed
    ...(isAtlasConnection && !uri.startsWith("mongodb+srv://") ? { tls: true } : {}),
    // Connection timeout settings (increase for production)
    serverSelectionTimeoutMS: 30000, // 30 seconds
    connectTimeoutMS: 30000, // 30 seconds
    // Retry settings for better reliability
    retryWrites: true,
    retryReads: true,
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development"){
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}else{
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

//Helper: get DB name from env, with a default.
export function getDbName() {
    return process.env.MONGODB_DB || "nextstep_ai";
}