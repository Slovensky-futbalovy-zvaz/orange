import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFindOne } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/models/User", () => ({
  default: { findOne: mockFindOne },
}));

import { GET, POST } from "@/app/api/auth/verify/route";
import { AUTH_COOKIE } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

const makePostReq = (body: object) =>
  new NextRequest("http://localhost:3000/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

// GET token NEKONZUMUJE — len presmeruje na potvrdzovaciu stránku
// (chráni magic link pred poštovými skenermi, ktoré robia GET prefetch).
describe("GET /api/auth/verify", () => {
  it("redirects to the confirmation page and does NOT consume the token", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/verify?token=abc");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/verify?token=abc");
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("redirects to /auth/verify even without a token", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/verify");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/verify");
    expect(mockFindOne).not.toHaveBeenCalled();
  });
});

// POST token KONZUMUJE — overí, aktivuje konto a nastaví session cookie.
describe("POST /api/auth/verify", () => {
  it("returns 400 when token is missing", async () => {
    const res = await POST(makePostReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 (expired) when token not found in DB", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await POST(makePostReq({ token: "nonexistent" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("expired");
  });

  it("activates user, sets JWT cookie and returns ok on valid token", async () => {
    const mockUser = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      email: "user@test.sk",
      role: "user" as const,
      status: "pending",
      magicToken: "validtoken123",
      magicTokenExpiry: new Date(Date.now() + 60_000),
      save: vi.fn().mockResolvedValue({}),
    };
    mockFindOne.mockResolvedValue(mockUser);

    const res = await POST(makePostReq({ token: "validtoken123" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${AUTH_COOKIE}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(mockUser.status).toBe("active");
    expect(mockUser.magicToken).toBeNull();
    expect(mockUser.magicTokenExpiry).toBeNull();
    expect(mockUser.save).toHaveBeenCalledOnce();
  });

  it("queries DB with expiry check ($gt on magicTokenExpiry)", async () => {
    mockFindOne.mockResolvedValue(null);
    await POST(makePostReq({ token: "anytoken" }));
    expect(mockFindOne).toHaveBeenCalledWith({
      magicToken: "anytoken",
      magicTokenExpiry: { $gt: expect.any(Date) },
    });
  });
});
