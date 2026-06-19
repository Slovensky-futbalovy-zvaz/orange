import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFindOne } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/models/User", () => ({
  default: { findOne: mockFindOne },
}));

import { GET } from "@/app/api/auth/verify/route";
import { AUTH_COOKIE } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/verify", () => {
  it("redirects to /login?error=invalid when token param is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/verify");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=invalid");
  });

  it("redirects to /login?error=expired when token not found in DB", async () => {
    mockFindOne.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify?token=nonexistent"
    );
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=expired");
  });

  it("activates user, sets JWT cookie and redirects to / on valid token", async () => {
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

    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify?token=validtoken123"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
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
    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify?token=anytoken"
    );
    await GET(req);
    expect(mockFindOne).toHaveBeenCalledWith({
      magicToken: "anytoken",
      magicTokenExpiry: { $gt: expect.any(Date) },
    });
  });
});
