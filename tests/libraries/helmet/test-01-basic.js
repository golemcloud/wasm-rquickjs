import assert from "assert";
import helmet from "helmet";

function createContext() {
  const headers = new Map();
  const removed = [];
  let nextCalls = 0;

  const req = { method: "GET", url: "/" };
  const res = {
    setHeader(name, value) {
      headers.set(name, value);
    },
    removeHeader(name) {
      removed.push(name);
    },
  };
  const next = () => {
    nextCalls += 1;
  };

  return { req, res, next, headers, removed, get nextCalls() { return nextCalls; } };
}

export const run = () => {
  const ctx = createContext();
  const middleware = helmet();

  middleware(ctx.req, ctx.res, ctx.next);

  assert.strictEqual(ctx.nextCalls, 1);
  assert.strictEqual(ctx.headers.get("X-Content-Type-Options"), "nosniff");
  assert.strictEqual(ctx.headers.get("X-DNS-Prefetch-Control"), "off");
  assert.strictEqual(ctx.headers.get("X-Download-Options"), "noopen");
  assert.strictEqual(ctx.headers.get("X-Frame-Options"), "SAMEORIGIN");
  assert.strictEqual(ctx.headers.get("X-Permitted-Cross-Domain-Policies"), "none");
  assert.strictEqual(ctx.headers.get("Referrer-Policy"), "no-referrer");
  assert.strictEqual(ctx.headers.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.strictEqual(ctx.headers.get("Cross-Origin-Resource-Policy"), "same-origin");
  assert.strictEqual(ctx.headers.get("Origin-Agent-Cluster"), "?1");
  assert.strictEqual(ctx.headers.get("X-XSS-Protection"), "0");
  assert.strictEqual(ctx.headers.get("Strict-Transport-Security"), "max-age=31536000; includeSubDomains");
  assert.match(ctx.headers.get("Content-Security-Policy"), /default-src 'self'/);
  assert.strictEqual(ctx.headers.has("Cross-Origin-Embedder-Policy"), false);
  assert.deepStrictEqual(ctx.removed, ["X-Powered-By"]);

  return "PASS: helmet() sets default security headers";
};
