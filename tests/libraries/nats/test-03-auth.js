import assert from "assert";
import {
  jwtAuthenticator,
  nkeyAuthenticator,
  tokenAuthenticator,
  usernamePasswordAuthenticator,
} from "nats";

const USER_SEED = "SUADRGZLN67HTLVS6WDBZFU3YWE2Y7VYBWAQGXFUP3PSHTKWPA4M5IDWQU";
const USER_PUBLIC = "UDJNX5OV6L4TXPRGJNVMD75VPC54VG3G5XLHV3IF2OD43ISHSVBNIHRN";
const SEED_BYTES = new TextEncoder().encode(USER_SEED);

export const run = async () => {
  const nonce = new TextEncoder().encode("abc123");

  const up = await usernamePasswordAuthenticator("demo", "secret")();
  assert.deepStrictEqual(up, { user: "demo", pass: "secret" });

  const token = await tokenAuthenticator("tok-123")();
  assert.deepStrictEqual(token, { auth_token: "tok-123" });

  const jwtOnly = await jwtAuthenticator("header.payload.signature")();
  assert.strictEqual(jwtOnly.jwt, "header.payload.signature");
  assert.strictEqual(jwtOnly.nkey, "");
  assert.strictEqual(jwtOnly.sig, "");

  const nkey = await nkeyAuthenticator(SEED_BYTES)(nonce);
  assert.strictEqual(nkey.nkey, USER_PUBLIC);
  assert.ok(typeof nkey.sig === "string" && nkey.sig.length > 10);

  const jwtAndNkey = await jwtAuthenticator("jwt-value", SEED_BYTES)(nonce);
  assert.strictEqual(jwtAndNkey.jwt, "jwt-value");
  assert.strictEqual(jwtAndNkey.nkey, USER_PUBLIC);
  assert.ok(typeof jwtAndNkey.sig === "string" && jwtAndNkey.sig.length > 10);

  return "PASS: authenticators produce expected credentials and signatures";
};
