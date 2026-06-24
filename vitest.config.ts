import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./vitest.env.ts", "./vitest.setup.ts"],
  },
});
