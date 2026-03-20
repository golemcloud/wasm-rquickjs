import assert from "assert";
import helmet from "helmet";

function createContext() {
  const headers = new Map();
  let nextCalls = 0;

  const req = { nonce: "abc123" };
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
  const middleware = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req) => `'nonce-${req.nonce}'`],
      objectSrc: ["'none'"],
    },
  });

  const ctx = createContext();
  middleware(ctx.req, ctx.res, ctx.next);

  const csp = ctx.headers.get("Content-Security-Policy");
  assert.strictEqual(ctx.nextCalls, 1);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'nonce-abc123'/);
  assert.match(csp, /object-src 'none'/);

  return "PASS: CSP dynamic directive functions are resolved per request";
};
