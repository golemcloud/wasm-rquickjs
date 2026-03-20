import assert from "assert";
import request from "supertest";

const makeReq = (cookieHeader) => ({
  getHeaders: () => (cookieHeader ? { cookie: cookieHeader } : {}),
});

export const run = () => {
  const cookies = request.cookies;

  const setAssertion = cookies.set({
    name: "session",
    value: "abc",
    options: { httponly: true, path: "/" },
  });
  assert.strictEqual(setAssertion({
    req: makeReq(""),
    headers: {
      "set-cookie": ["session=abc; Path=/; HttpOnly"],
    },
  }), undefined);

  const containAssertion = cookies.contain({
    name: "user",
    value: "alice",
    options: { path: "/" },
  });
  assert.strictEqual(containAssertion({
    req: makeReq(""),
    headers: {
      "set-cookie": ["user=alice; Path=/; Secure"],
    },
  }), undefined);

  const notSetAssertion = cookies.not("set", { name: "missing", options: {} });
  assert.strictEqual(notSetAssertion({
    req: makeReq(""),
    headers: {
      "set-cookie": ["session=abc; Path=/"],
    },
  }), undefined);

  return "PASS: cookie assertion helpers validate set/contain/not semantics";
};
