import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

process.env.DATABASE_URL = "mysql://fixture:local_only@127.0.0.1:1/local_test";
process.env.TOKIO_WORKER_THREADS = "4";
const { configureRuntime, databaseUrl } = await import("../config/runtime.js");
const { createReadinessCheck } = await import("../services/readiness.js");

test("worker defaults are bounded and explicit smaller budgets survive", () => {
  const env = {}; configureRuntime(env); assert.equal(env.TOKIO_WORKER_THREADS, "4");
  configureRuntime({ TOKIO_WORKER_THREADS: "1" });
  for (const value of ["0", "64", "invalid"]) assert.throws(() => configureRuntime({ TOKIO_WORKER_THREADS: value }));
});

test("pool defaults preserve connection identity and explicit parameters", () => {
  const original = new URL("mysql://fixture:encoded%40password@127.0.0.1:3306/fixture?sslaccept=strict");
  const actual = new URL(databaseUrl(original.href));
  for (const key of ["username", "password", "hostname", "port", "pathname"]) assert.equal(actual[key], original[key]);
  assert.equal(actual.searchParams.get("connection_limit"), "5");
  assert.equal(actual.searchParams.get("pool_timeout"), "10");
  assert.equal(actual.searchParams.get("connect_timeout"), "5");
  assert.equal(actual.searchParams.get("sslaccept"), "strict");
  assert.equal(new URL(databaseUrl(original.href + "&connection_limit=2")).searchParams.get("connection_limit"), "2");
  assert.throws(() => databaseUrl("not a URL"));
});

test("real generated Prisma client has bounded configuration and is shared in production", () => {
  const script = `
    const {default: first} = await import('./prisma/client.js?first');
    const {default: second} = await import('./prisma/client.js?second');
    const url = new URL(first._engineConfig.overrideDatasources.db.url);
    console.log(JSON.stringify({same: first === second, workers: process.env.TOKIO_WORKER_THREADS, pool: url.searchParams.get('connection_limit'), engine: first._engineConfig.generator.config.engineType}));
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, NODE_ENV: "production", TOKIO_WORKER_THREADS: "" }, encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.trim()), {same: true, workers: "4", pool: "5", engine: "binary"});
});

test("a hanging readiness query times out without creating a query backlog", async () => {
  let calls = 0;
  const ready = createReadinessCheck({ $queryRaw: () => { calls++; return new Promise(() => {}); } }, { timeoutMs: 15, ttlMs: 0 });
  assert.deepEqual(await Promise.all([ready(), ready(), ready()]), [false, false, false]);
  assert.equal(await ready(), false);
  assert.equal(calls, 1);
});

test("readiness recovers from failure and only runs SELECT 1", async () => {
  let fail = true;
  const ready = createReadinessCheck({ $queryRaw: async (sql) => { assert.equal(sql.join(""), "SELECT 1"); if (fail) throw new Error("offline"); return [{1:1}]; } }, { ttlMs: 0 });
  assert.equal(await ready(), false); fail = false; assert.equal(await ready(), true);
});

for (const mode of ["healthy", "offline"]) test("production entrypoint separates liveness from database readiness: " + mode, async () => {
  const reservation = createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening");
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const script = `globalThis.prisma = { $queryRaw: async () => { ${mode === "offline" ? "throw new Error('offline fixture');" : "return [{1:1}];"} } }; await import('./server.js');`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", JWT_SECRET: "fixture-secret-only-not-production" }, stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => { clearTimeout(timer); reject(new Error("Server exited " + code)); });
      child.stdout.on("data", data => { if (String(data).includes("Server running")) { clearTimeout(timer); resolve(); } });
    });
    const live = await fetch(`http://127.0.0.1:${port}/health/live`);
    assert.equal(live.status, 200); assert.match(live.headers.get("cache-control"), /no-store/);
    const ready = await fetch(`http://127.0.0.1:${port}/health/ready`);
    assert.equal(ready.status, mode === "healthy" ? 200 : 503);
    assert.deepEqual(await ready.json(), {status: mode === "healthy" ? "ready" : "unavailable"});
  } finally { const exited = once(child, "exit"); child.kill(); await exited; }
});
