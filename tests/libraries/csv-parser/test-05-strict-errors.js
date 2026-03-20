import assert from "assert";
import csvParser from "csv-parser";

const parseError = (input, options = {}) =>
  new Promise((resolve, reject) => {
    let finished = false;
    const parser = csvParser(options);

    parser.on("error", (error) => {
      finished = true;
      resolve(error);
    });

    parser.on("end", () => {
      if (!finished) {
        reject(new Error("Expected parser to fail but it finished successfully"));
      }
    });

    parser.write(input);
    parser.end();
  });

export const run = async () => {
  const error = await parseError("a,b\n1,2,3\n", { strict: true });

  assert.ok(error instanceof Error);
  assert.match(error.message, /Row length does not match headers/);

  return "PASS: emits strict-mode row-length errors";
};
