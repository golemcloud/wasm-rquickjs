import assert from "assert";
import pdf from "pdf-parse";

export const run = async () => {
  await assert.rejects(
    () => pdf(Buffer.from("This is not a valid PDF document", "utf8")),
    (error) => {
      assert.ok(error instanceof Error, "Expected an Error instance");
      return true;
    },
  );

  return "PASS: invalid PDF input rejects with an error";
};
