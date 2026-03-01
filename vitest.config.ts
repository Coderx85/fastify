import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/schema": resolve(__dirname, "./src/schema"),
      "@/db": resolve(__dirname, "./src/db"),
      "@/routes": resolve(__dirname, "./src/routes"),
      "@/modules": resolve(__dirname, "./src/modules"),
      "@/types": resolve(__dirname, "./src/types"),
      "@test": resolve(__dirname, "./test"),
    },
  },
  test: {
    globals: true,
    exclude: ["node_modules", "dist"],
  },
});
