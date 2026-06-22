import { describe, it, expect, afterEach } from "vitest";
import { GET, POST } from "@/app/api/auth/setup/route";

// Manuálny setup je zakázaný — primárny správca sa vytvára automaticky
// z FROM_EMAIL pri prvom pripojení k DB (viď lib/seed.ts).
// GET vracia konfiguračný stav, POST je vždy zamietnutý (403).

describe("GET /api/auth/setup", () => {
  const original = process.env.FROM_EMAIL;
  afterEach(() => {
    if (original === undefined) delete process.env.FROM_EMAIL;
    else process.env.FROM_EMAIL = original;
  });

  it("always reports isEmpty: false (manual setup disabled)", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.isEmpty).toBe(false);
  });

  it("reports fromEmailSet: true when FROM_EMAIL is set", async () => {
    process.env.FROM_EMAIL = "admin@test.sk";
    const res = await GET();
    const data = await res.json();
    expect(data.fromEmailSet).toBe(true);
  });

  it("reports fromEmailSet: false when FROM_EMAIL is missing", async () => {
    delete process.env.FROM_EMAIL;
    const res = await GET();
    const data = await res.json();
    expect(data.fromEmailSet).toBe(false);
  });
});

describe("POST /api/auth/setup", () => {
  it("returns 403 — manual setup is disabled", async () => {
    const res = await POST();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});
