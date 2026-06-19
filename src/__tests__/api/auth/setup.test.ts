import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vi.mock is hoisted — declare mocks with vi.hoisted so they are available inside factory
const { mockCountDocuments, mockCreate } = vi.hoisted(() => ({
  mockCountDocuments: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendAdminActivation: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/models/User", () => ({
  default: {
    countDocuments: mockCountDocuments,
    create: mockCreate,
  },
}));

import { GET, POST } from "@/app/api/auth/setup/route";
import { sendAdminActivation } from "@/lib/email";

beforeEach(() => {
  vi.clearAllMocks();
});

const makePostReq = (body: object) =>
  new NextRequest("http://localhost:3000/api/auth/setup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("GET /api/auth/setup", () => {
  it("returns isEmpty: true when no users exist", async () => {
    mockCountDocuments.mockResolvedValue(0);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.isEmpty).toBe(true);
  });

  it("returns isEmpty: false when users exist", async () => {
    mockCountDocuments.mockResolvedValue(3);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.isEmpty).toBe(false);
  });
});

describe("POST /api/auth/setup", () => {
  it("returns 403 when a user already exists", async () => {
    mockCountDocuments.mockResolvedValue(1);
    const res = await POST(
      makePostReq({ email: "a@b.sk", firstName: "A", lastName: "B" })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 when required fields are missing", async () => {
    mockCountDocuments.mockResolvedValue(0);
    const res = await POST(makePostReq({ email: "a@b.sk" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when firstName is missing", async () => {
    mockCountDocuments.mockResolvedValue(0);
    const res = await POST(makePostReq({ email: "a@b.sk", lastName: "B" }));
    expect(res.status).toBe(400);
  });

  it("creates admin, sends activation email, returns ok:true", async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue({
      email: "admin@test.sk",
      firstName: "Admin",
      _id: "507f1f77bcf86cd799439011",
    });

    const res = await POST(
      makePostReq({ email: "admin@test.sk", firstName: "Admin", lastName: "Test" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(sendAdminActivation).toHaveBeenCalledOnce();
  });

  it("stores email in lowercase with admin role and pending status", async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ email: "admin@test.sk", firstName: "Admin" });

    await POST(
      makePostReq({ email: "ADMIN@TEST.SK", firstName: "Admin", lastName: "Test" })
    );

    const createArgs = mockCreate.mock.calls[0][0];
    expect(createArgs.email).toBe("admin@test.sk");
    expect(createArgs.role).toBe("admin");
    expect(createArgs.status).toBe("pending");
  });
});
