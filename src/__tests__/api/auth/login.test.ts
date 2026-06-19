import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFindOne } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendMagicLink: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/models/User", () => ({
  default: { findOne: mockFindOne },
}));

import { POST } from "@/app/api/auth/login/route";
import { sendMagicLink } from "@/lib/email";

beforeEach(() => {
  vi.clearAllMocks();
});

const makeReq = (body: object) =>
  new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns ok:true and sends NO email when user does not exist (security)", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await POST(makeReq({ email: "ghost@test.sk" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("returns ok:true and sends NO email for pending user", async () => {
    mockFindOne.mockResolvedValue({ email: "pending@test.sk", status: "pending" });
    const res = await POST(makeReq({ email: "pending@test.sk" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("returns ok:true and sends magic link for active user", async () => {
    const mockUser = {
      email: "user@test.sk",
      firstName: "Test",
      status: "active",
      magicToken: null,
      magicTokenExpiry: null,
      save: vi.fn().mockResolvedValue({}),
    };
    mockFindOne.mockResolvedValue(mockUser);

    const res = await POST(makeReq({ email: "user@test.sk" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMagicLink).toHaveBeenCalledOnce();
    expect(mockUser.save).toHaveBeenCalledOnce();
    expect(mockUser.magicToken).not.toBeNull();
    expect(mockUser.magicTokenExpiry).not.toBeNull();
  });

  it("normalises email to lowercase before lookup", async () => {
    mockFindOne.mockResolvedValue(null);
    await POST(makeReq({ email: "USER@TEST.SK" }));
    expect(mockFindOne).toHaveBeenCalledWith({ email: "user@test.sk" });
  });
});
