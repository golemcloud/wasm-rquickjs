import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  const info = await transporter.sendMail({
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "basic json transport",
    text: "hello from nodemailer",
  });

  assert.strictEqual(info.envelope.from, "sender@example.com");
  assert.deepStrictEqual(info.envelope.to, ["receiver@example.com"]);
  assert.ok(typeof info.messageId === "string" && info.messageId.length > 0);

  const payload = JSON.parse(info.message);
  assert.strictEqual(payload.subject, "basic json transport");
  assert.strictEqual(payload.text, "hello from nodemailer");

  return "PASS: json transport sends a basic message";
};
