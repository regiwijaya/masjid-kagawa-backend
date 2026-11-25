import "../config/runtime.js";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Generate platform-native client/engine during install; never migrate or seed.
const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("prisma"), "generate"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
