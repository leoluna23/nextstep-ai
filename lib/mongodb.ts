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
// MongoDB Atlas uses mongodb+srv:// which automatically handles TLS
// For regular mongodb:// connections, we may need to configure TLS explicitly

const options: {
    serverSelectionTimeoutMS?: number;
    connectTimeoutMS?: number;
    socketTimeoutMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    tls?: boolean;
    tlsAllowInvalidCertificates?: boolean;
    tlsAllowInvalidHostnames?: boolean;
} = {
    // Connection timeout settings (increase for production)
    serverSelectionTimeoutMS: 30000, // 30 seconds
    connectTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    // Retry settings for better reliability
    retryWrites: true,
    retryReads: true,
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    // For non-SRV connections, configure TLS if needed
    // mongodb+srv:// automatically handles TLS, so we don't need to set it
    ...(uri.startsWith("mongodb://") && (uri.includes("ssl=true") || uri.includes("tls=true")) ? {
        tls: true,
        // In production, these should be false for security
        // Set to true only if you're having certificate validation issues
        tlsAllowInvalidCertificates: process.env.NODE_ENV === "development",
        tlsAllowInvalidHostnames: process.env.NODE_ENV === "development",
    } : {}),
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Helper function to create client with error handling
function createClient() {
    if (!uri) {
        throw new Error("MONGODB_URI is not set");
    }
    try {
        const mongoClient = new MongoClient(uri, options);
        return mongoClient.connect().catch((error) => {
            console.error("MongoDB connection error:", error);
            // Log helpful debugging information
            if (error.message?.includes("SSL") || error.message?.includes("TLS")) {
                console.error("SSL/TLS Error detected. Check:");
                console.error("1. MongoDB Atlas connection string format (should be mongodb+srv://...)");
                console.error("2. IP whitelist in MongoDB Atlas includes DigitalOcean IPs");
                console.error("3. MongoDB Atlas cluster is running and accessible");
                console.error("4. Connection string is correctly set in environment variables");
            }
            throw error;
        });
    } catch (error) {
        console.error("Failed to create MongoDB client:", error);
        throw error;
    }
}

if (process.env.NODE_ENV === "development"){
    if (!global._mongoClientPromise) {
        clientPromise = createClient();
        global._mongoClientPromise = clientPromise;
    }
    clientPromise = global._mongoClientPromise;
}else{
    clientPromise = createClient();
}

export default clientPromise;

//Helper: get DB name from env, with a default.
export function getDbName() {
    return process.env.MONGODB_DB || "nextstep_ai";
}