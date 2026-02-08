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

const options = {};

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