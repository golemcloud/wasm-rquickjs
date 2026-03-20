import assert from "assert";
import connectModule from "amqplib/lib/connect.js";

export const run = () => {
  const creds = connectModule.credentialsFromUrl({
    username: "alice",
    password: "wonder",
  });

  assert.strictEqual(creds.mechanism, "PLAIN");
  assert.strictEqual(creds.response().toString("utf8"), "\u0000alice\u0000wonder");

  const guestCreds = connectModule.credentialsFromUrl({
    username: "",
    password: "",
  });
  assert.strictEqual(guestCreds.response().toString("utf8"), "\u0000guest\u0000guest");

  return "PASS: credentialsFromUrl chooses expected default and explicit credentials";
};
