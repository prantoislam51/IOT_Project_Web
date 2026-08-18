import mongoose, { type Mongoose } from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Copy .env.example to .env and set your MongoDB connection string."
  );
}

/**
 * Cached MongoDB connection for Next.js — avoids opening a new connection
 * on every request in development (hot reloads) and serverless invocations.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  const cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null });

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
