import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

await esbuild.build({
  entryPoints: [join(rootDir, "api/_serverless.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(rootDir, "api/index.js"),
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
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const require = createRequire(import.meta.url);
`,
  },
});

console.log("✅ Serverless function bundled to api/index.js");
