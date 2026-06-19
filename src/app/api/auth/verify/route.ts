export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signJWT, AUTH_COOKIE } from "@/lib/auth";

/** Overí magic token, nastaví session cookie a presmeruje na domovskú stránku */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid", req.url)
      );
    }

    await connectDB();

    const user = await User.findOne({
      magicToken: token,
      magicTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=expired", req.url)
      );
    }

    // Aktivuje konto (pre nových používateľov)
    user.status = "active";
    user.magicToken = null;
    user.magicTokenExpiry = null;
    await user.save();

    const jwt = await signJWT({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.redirect(new URL("/", req.url));
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
    return NextResponse.redirect(new URL("/login?error=server", req.url));
  }
}
