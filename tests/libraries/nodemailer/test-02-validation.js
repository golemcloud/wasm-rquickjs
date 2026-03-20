import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    jsonTransport: true,
    skipEncoding: true,
  });

  const info = await transporter.sendMail({
    envelope: {
      from: "bounce@example.com",
      to: ["first@example.com", "second@example.com"],
    },
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "skip encoding",
    text: "json transport object output",
  });

  assert.strictEqual(info.envelope.from, "bounce@example.com");
  assert.deepStrictEqual(info.envelope.to, ["first@example.com", "second@example.com"]);
  assert.ok(info.message && typeof info.message === "object");
  assert.strictEqual(info.message.subject, "skip encoding");
  assert.strictEqual(info.message.text, "json transport object output");

  return "PASS: json transport skipEncoding and custom envelope work";
};
