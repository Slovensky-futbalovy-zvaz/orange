import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./mongodb";
import User, { IUser } from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
export const AUTH_COOKIE = "ov_auth";
const TOKEN_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  role: "admin" | "user";
  email: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Získa aktuálneho prihláseného používateľa zo serverovej cookie */
export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    await connectDB();
    const user = (await User.findById(payload.userId).lean()) as IUser | null;
    if (!user || user.status !== "active") return null;
    return user;
  } catch {
    return null;
  }
}

/** Vygeneruje náhodný bezpečný token (pre magic link) */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
