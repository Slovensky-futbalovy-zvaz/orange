export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signJWT, AUTH_COOKIE } from "@/lib/auth";

/**
 * GET — len presmeruje na potvrdzovaciu stránku, token NESPOTREBUJE.
 * Dôvod: poštové skenery (napr. Microsoft Safe Links) automaticky prednačítajú
 * odkazy v e-maile cez GET. Keby sme token spotrebovali tu, skener by ho
 * zneplatnil ešte pred kliknutím používateľa. Skutočné overenie robí až POST,
 * ktorý vyvolá používateľ kliknutím na tlačidlo.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const url = new URL("/auth/verify", req.url);
  if (token) url.searchParams.set("token", token);
  return NextResponse.redirect(url);
}

/** POST — overí magic token, aktivuje konto, nastaví session cookie. */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json().catch(() => ({ token: "" }));
    if (!token) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      magicToken: token,
      magicTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }

    // Aktivuje konto (pre nových používateľov) a token zneplatní (jednorazový)
    user.status = "active";
    user.magicToken = null;
    user.magicTokenExpiry = null;
    await user.save();

    const jwt = await signJWT({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dní
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
