import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    env: {
      JWT_SECRET: "test-secret-for-vitest-32chars-abcdef!!",
      MONGODB_URI: "mongodb://localhost/orange-test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
