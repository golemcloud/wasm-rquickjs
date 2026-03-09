import assert from "assert";
import cors from "cors";
import { runMiddleware } from "./helpers.js";

export const run = () => {
  const middleware = cors((req, callback) => {
    if (req.path === "/restricted") {
      callback(null, {
        origin: "https://admin.example",
        preflightContinue: true,
        optionsSuccessStatus: 200,
      });
      return;
    }

    callback(null, { origin: "*" });
  });

  const preflight = runMiddleware(middleware, {
    method: "OPTIONS",
    path: "/restricted",
    headers: {
      origin: "https://admin.example",
    },
  });

  assert.strictEqual(preflight.nextCalled, 1);
  assert.strictEqual(preflight.nextError, undefined);
  assert.strictEqual(preflight.res.ended, false);
  assert.strictEqual(preflight.res.statusCode, 200);
  assert.strictEqual(preflight.res.getHeader("access-control-allow-origin"), "https://admin.example");
  assert.ok(preflight.res.getHeader("vary")?.includes("Origin"));

  const passthrough = runMiddleware(middleware, {
    method: "GET",
    path: "/public",
    headers: {
      origin: "https://anywhere.example",
    },
  });

  assert.strictEqual(passthrough.nextCalled, 1);
  assert.strictEqual(passthrough.nextError, undefined);
  assert.strictEqual(passthrough.res.getHeader("access-control-allow-origin"), "*");

  const erroring = runMiddleware(cors((req, callback) => {
    callback(new Error("options lookup failed"));
  }), {
    method: "GET",
    headers: {
      origin: "https://anywhere.example",
    },
  });

  assert.strictEqual(erroring.nextCalled, 1);
  assert.strictEqual(erroring.nextError?.message, "options lookup failed");

  return "PASS: top-level options delegate supports per-route options and forwards callback errors";
};
