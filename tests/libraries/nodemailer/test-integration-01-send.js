import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1026,
    secure: false,
  });

  const info = await transporter.sendMail({
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "integration test basic send",
    text: "hello from nodemailer integration test",
  });

  assert.ok(info.messageId, "messageId should be truthy");
  assert.ok(
    typeof info.messageId === "string" && info.messageId.length > 0,
    "messageId should be a non-empty string"
  );

  return "PASS: SMTP send via MailHog returns a valid messageId";
};
