import assert from "assert";
import helmet from "helmet";

export const run = () => {
  assert.throws(
    () => helmet.xFrameOptions({ action: "invalid" }),
    /X-Frame-Options/i,
  );

  assert.throws(
    () => helmet.referrerPolicy({ policy: "bad-policy" }),
    /Referrer-Policy/i,
  );

  assert.throws(
    () => helmet.crossOriginResourcePolicy({ policy: "not-valid" }),
    /Cross-Origin-Resource-Policy/i,
  );

  return "PASS: invalid option values are rejected";
};
