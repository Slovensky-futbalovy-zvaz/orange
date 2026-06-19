import mongoose from "mongoose";
import { seedAdmin } from "@/lib/seed";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Prosím nastav MONGODB_URI v .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null, seeded: false };
global.mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;

  if (!cached.seeded) {
    cached.seeded = true;
    await seedAdmin().catch((err) =>
      console.error("[seed] Chyba pri vytváraní primárneho správcu:", err)
    );
  }

  return cached.conn;
}
