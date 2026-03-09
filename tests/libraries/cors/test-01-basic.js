import assert from "assert";
import cors from "cors";
import { runMiddleware } from "./helpers.js";

export const run = () => {
  const middleware = cors();
  const { res, nextCalled, nextError } = runMiddleware(middleware, {
    method: "GET",
    headers: {
      origin: "https://client.example",
    },
  });

  assert.strictEqual(nextCalled, 1);
  assert.strictEqual(nextError, undefined);
  assert.strictEqual(res.ended, false);
  assert.strictEqual(res.getHeader("access-control-allow-origin"), "*");
  assert.strictEqual(res.getHeader("access-control-allow-methods"), undefined);
  assert.strictEqual(res.getHeader("access-control-allow-credentials"), undefined);

  return "PASS: default middleware sets wildcard origin and continues simple requests";
};
