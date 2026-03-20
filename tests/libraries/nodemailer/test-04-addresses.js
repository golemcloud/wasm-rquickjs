import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  const info = await transporter.sendMail({
    from: '"Example, Sender" <sender@example.com>',
    to: "Alice <alice@example.com>, bob@example.com",
    cc: "Team: c1@example.com, c2@example.com;",
    replyTo: "reply@example.com",
    subject: "address parsing",
    text: "address test",
  });

  const recipients = [...info.envelope.to].sort();
  assert.deepStrictEqual(recipients, [
    "alice@example.com",
    "bob@example.com",
    "c1@example.com",
    "c2@example.com",
  ]);

  const serialized = info.message;
  assert.match(serialized, /sender@example\.com/);
  assert.match(serialized, /alice@example\.com/);
  assert.match(serialized, /c2@example\.com/);
  assert.match(serialized, /reply@example\.com/);

  return "PASS: address fields are normalized and preserved";
};
