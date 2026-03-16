import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1026,
    secure: false,
  });

  // Verify SMTP connectivity
  const verifyResult = await transporter.verify();
  assert.strictEqual(verifyResult, true, "transport.verify() should return true");

  // Send an email with HTML body and an inline Buffer attachment
  const info = await transporter.sendMail({
    from: "alice@example.com",
    to: "bob@example.com",
    subject: "integration test with HTML and attachment",
    html: "<h1>Hello</h1><p>This is an HTML email with an attachment.</p>",
    attachments: [
      {
        filename: "test.txt",
        content: Buffer.from("attachment content here"),
      },
    ],
  });

  assert.ok(info.messageId, "messageId should be truthy");
  assert.ok(
    Array.isArray(info.accepted) && info.accepted.includes("bob@example.com"),
    "info.accepted should include recipient"
  );

  return "PASS: SMTP verify + HTML send with Buffer attachment succeeds";
};
