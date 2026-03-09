import assert from "assert";
import helmet from "helmet";

function createContext() {
  const headers = new Map();
  let nextCalls = 0;

  const req = { method: "GET", url: "/standalone" };
  const res = {
    setHeader(name, value) {
      headers.set(name, value);
    },
  };

  return {
    req,
    res,
    headers,
    next() {
      nextCalls += 1;
    },
    get nextCalls() {
      return nextCalls;
    },
  };
}

export const run = () => {
  const ctx = createContext();

  const middlewares = [
    helmet.strictTransportSecurity({ maxAge: 123, includeSubDomains: false }),
    helmet.referrerPolicy({ policy: ["origin", "unsafe-url"] }),
    helmet.xPermittedCrossDomainPolicies({ permittedPolicies: "master-only" }),
  ];

  for (const middleware of middlewares) {
    middleware(ctx.req, ctx.res, ctx.next);
  }

  assert.strictEqual(ctx.nextCalls, 3);
  assert.strictEqual(ctx.headers.get("Strict-Transport-Security"), "max-age=123");
  assert.strictEqual(ctx.headers.get("Referrer-Policy"), "origin,unsafe-url");
  assert.strictEqual(ctx.headers.get("X-Permitted-Cross-Domain-Policies"), "master-only");

  return "PASS: standalone middleware factories set expected headers";
};
