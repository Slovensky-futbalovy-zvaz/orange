import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const AUTH_COOKIE = "ov_auth";

// Cesty prístupné bez prihlásenia (prefix match)
const PUBLIC_PREFIXES = [
  "/login",
  "/auth/verify",
  "/api/auth/setup",
  "/api/auth/login",
  "/api/auth/verify",
  "/api/auth/logout",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Povolíme root landing page (exact match), statické súbory a verejné cesty
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Admin-only cesty (stránky aj API)
    const ADMIN_PREFIXES = [
      "/admin",
      "/api/admin",
      "/companies",
      "/people",
      "/import",
      "/codebook",
      "/api/people",
      "/api/codebook",
    ];
    if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/overview", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
