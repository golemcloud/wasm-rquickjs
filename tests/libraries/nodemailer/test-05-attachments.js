import assert from "assert";
import nodemailer from "nodemailer";

export const run = async () => {
  const transporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  const info = await transporter.sendMail({
    from: "sender@example.com",
    to: "receiver@example.com",
    subject: "attachment handling",
    text: "plain text body",
    html: '<div><img src="cid:inline-1"></div>',
    attachments: [
      {
        filename: "buf.txt",
        content: Buffer.from("buffer-content", "utf8"),
      },
      {
        filename: "inline.txt",
        content: "inline-content",
        cid: "inline-1",
      },
    ],
  });

  const payload = JSON.parse(info.message);
  assert.ok(Array.isArray(payload.attachments));
  assert.strictEqual(payload.attachments.length, 2);

  const filenames = payload.attachments.map((entry) => entry.filename).sort();
  assert.deepStrictEqual(filenames, ["buf.txt", "inline.txt"]);
  assert.ok(payload.attachments.some((entry) => entry.cid === "inline-1"));
  assert.match(payload.html, /cid:inline-1/);

  return "PASS: attachments are normalized in json transport output";
};
