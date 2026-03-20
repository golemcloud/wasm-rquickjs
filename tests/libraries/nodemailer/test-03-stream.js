import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
  });

  const info = await transporter.sendMail({
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "stream transport",
    text: "plain body",
    html: "<b>html body</b>",
    messageId: "<fixed-stream-id@example.com>",
    date: new Date("2020-01-01T00:00:00.000Z"),
    attachments: [
      {
        filename: "note.txt",
        content: "attachment body",
      },
    ],
  });

  const raw = info.message.toString("utf8");
  assert.match(raw, /Subject: stream transport/);
  assert.match(raw, /Content-Type: multipart\/mixed;/);
  assert.match(raw, /Content-Type: text\/plain;/);
  assert.match(raw, /Content-Disposition: attachment; filename=note\.txt/);

  return "PASS: stream transport returns a MIME buffer";
};
