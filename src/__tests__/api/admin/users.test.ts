import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockLean, mockFindOne, mockCreate, mockGetCurrentUser } = vi.hoisted(() => ({
  mockLean: vi.fn(),
  mockFindOne: vi.fn(),
  mockCreate: vi.fn(),
  mockGetCurrentUser: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendInvitation: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/models/User", () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn(() => ({ lean: mockLean })),
    })),
    findOne: mockFindOne,
    create: mockCreate,
  },
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: mockGetCurrentUser };
});

import { GET, POST } from "@/app/api/admin/users/route";
import { sendInvitation } from "@/lib/email";

beforeEach(() => {
  vi.clearAllMocks();
});

const adminUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "admin@test.sk",
  firstName: "Admin",
  lastName: "User",
  role: "admin" as const,
  status: "active" as const,
  companies: [],
};

const makePostReq = (body: object) =>
  new NextRequest("http://localhost:3000/api/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

// ─── GET ───────────────────────────────────────────────────────────────────

describe("GET /api/admin/users", () => {
  it("returns 403 when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 for non-admin users", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...adminUser, role: "user" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns user list for admin", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    mockLean.mockResolvedValue([adminUser]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].email).toBe("admin@test.sk");
  });
});

// ─── POST ──────────────────────────────────────────────────────────────────

describe("POST /api/admin/users", () => {
  it("returns 403 when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(
      makePostReq({ email: "new@test.sk", firstName: "New", lastName: "User", role: "user" })
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 for non-admin", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...adminUser, role: "user" });
    const res = await POST(
      makePostReq({ email: "new@test.sk", firstName: "New", lastName: "User", role: "user" })
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    const res = await POST(makePostReq({ email: "new@test.sk", firstName: "New" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    mockFindOne.mockResolvedValue({ email: "existing@test.sk" });
    const res = await POST(
      makePostReq({
        email: "existing@test.sk",
        firstName: "Ex",
        lastName: "User",
        role: "user",
      })
    );
    expect(res.status).toBe(409);
  });

  it("creates user, sends invitation, returns ok:true", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      email: "new@test.sk",
      firstName: "New",
      lastName: "User",
      _id: "507f191e810c19729de860ea",
      companies: ["SFZ"],
    });

    const res = await POST(
      makePostReq({
        email: "new@test.sk",
        firstName: "New",
        lastName: "User",
        role: "user",
        companies: ["SFZ"],
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.userId).toBeTruthy();
    expect(sendInvitation).toHaveBeenCalledOnce();
  });

  it("passes inviter full name to sendInvitation", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      email: "x@test.sk",
      firstName: "X",
      companies: [],
      _id: "1",
    });

    await POST(
      makePostReq({ email: "x@test.sk", firstName: "X", lastName: "Y", role: "user" })
    );

    const [, , , inviterName] = vi.mocked(sendInvitation).mock.calls[0];
    expect(inviterName).toBe("Admin User");
  });
});
