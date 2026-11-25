// Retain in-flight queries after timeout so stalled probes cannot grow a queue.
export function createReadinessCheck(prisma, { timeoutMs = 3000, ttlMs = 5000 } = {}) {
  let pending;
  let cached = false;
  let expires = 0;
  return async function ready() {
    if (Date.now() < expires) return cached;
    if (!pending) {
      pending = Promise.resolve().then(() => prisma.$queryRaw`SELECT 1`)
        .then(() => true, () => false)
        .finally(() => { pending = null; });
    }
    let timer;
    try {
      cached = await Promise.race([
        pending,
        new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); }),
      ]);
      expires = Date.now() + ttlMs;
      return cached;
    } finally {
      clearTimeout(timer);
    }
  };
}
