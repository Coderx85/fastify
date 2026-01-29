import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

await esbuild.build({
  entryPoints: [join(rootDir, "api/serverless.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(rootDir, "api/index.mjs"),
  external: [
    // Don't bundle native/binary modules
    "@electric-sql/pglite",
    "pg-native",
  ],
  alias: {
    "@": join(rootDir, "src"),
  },
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
  },
});

console.log("✅ Serverless function bundled to api/index.mjs");
