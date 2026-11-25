import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load before Prisma, including when Passenger starts server.js directly.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

export function configureRuntime(env = process.env) {
  const workers = env.TOKIO_WORKER_THREADS || "4";
  if (!/^[1-9]\d*$/.test(workers) || Number(workers) > 4) {
    throw new Error("TOKIO_WORKER_THREADS must be an integer between 1 and 4 on this hosting plan");
  }
  env.TOKIO_WORKER_THREADS = workers;
}

export function databaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
    if (url.protocol !== "mysql:") throw new Error();
  } catch {
    throw new Error("DATABASE_URL must be a valid MySQL URL");
  }
  // Connection limits and Tokio workers solve different resource constraints.
  for (const [key, fallback] of Object.entries({ connection_limit: "5", pool_timeout: "10", connect_timeout: "5" })) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, fallback);
    const value = url.searchParams.get(key);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error(`DATABASE_URL ${key} must be a positive integer`);
    }
  }
  return url.toString();
}

configureRuntime();
