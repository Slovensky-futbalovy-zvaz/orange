import { describe, it, expect } from "vitest";
import { signJWT, verifyJWT, generateToken } from "@/lib/auth";

describe("generateToken", () => {
  it("generates a 64-character hex string", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique tokens each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("signJWT / verifyJWT", () => {
  it("signs and verifies a valid payload", async () => {
    const payload = {
      userId: "507f1f77bcf86cd799439011",
      role: "admin" as const,
      email: "admin@test.sk",
    };
    const token = await signJWT(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature

    const verified = await verifyJWT(token);
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe(payload.role);
    expect(verified?.email).toBe(payload.email);
  });

  it("returns null for a tampered token", async () => {
    const token = await signJWT({
      userId: "1",
      role: "user",
      email: "x@test.sk",
    });
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyJWT(tampered);
    expect(result).toBeNull();
  });

  it("returns null for a completely invalid string", async () => {
    expect(await verifyJWT("not.a.jwt")).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await verifyJWT("")).toBeNull();
  });
});
