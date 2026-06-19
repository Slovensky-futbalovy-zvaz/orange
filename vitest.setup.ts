import { vi } from "vitest";

// Prevent "AsyncLocalStorage is not defined" and other SSR-only errors
// when next/headers is imported in test environment
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));
