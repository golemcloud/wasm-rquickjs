import assert from "assert";
import helmet from "helmet";

function createContext() {
  const headers = new Map();
  const removed = [];
  let nextCalls = 0;

  const req = { method: "GET", url: "/custom" };
  const res = {
    setHeader(name, value) {
      headers.set(name, value);
    },
    removeHeader(name) {
      removed.push(name);
    },
  };

  return {
    req,
    res,
    headers,
    removed,
    next() {
      nextCalls += 1;
    },
    get nextCalls() {
      return nextCalls;
    },
  };
}

export const run = () => {
  const middleware = helmet({
    contentSecurityPolicy: false,
    xDnsPrefetchControl: { allow: true },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    strictTransportSecurity: { maxAge: 60, includeSubDomains: false, preload: true },
    xPoweredBy: false,
  });

  const ctx = createContext();
  middleware(ctx.req, ctx.res, ctx.next);

  assert.strictEqual(ctx.nextCalls, 1);
  assert.strictEqual(ctx.headers.has("Content-Security-Policy"), false);
  assert.strictEqual(ctx.headers.get("X-DNS-Prefetch-Control"), "on");
  assert.strictEqual(ctx.headers.get("Cross-Origin-Embedder-Policy"), "require-corp");
  assert.strictEqual(ctx.headers.get("Cross-Origin-Resource-Policy"), "cross-origin");
  assert.strictEqual(ctx.headers.get("Strict-Transport-Security"), "max-age=60; preload");
  assert.deepStrictEqual(ctx.removed, []);

  return "PASS: top-level options enable and disable sub-middlewares";
};
