import assert from "assert";
import { MongoError, MongoErrorLabel, MongoInvalidArgumentError, MongoNetworkError } from "mongodb";

export const run = () => {
  const err = new MongoNetworkError("network glitch");
  assert.ok(err instanceof MongoError);
  err.addErrorLabel(MongoErrorLabel.RetryableWriteError);
  assert.strictEqual(err.hasErrorLabel(MongoErrorLabel.RetryableWriteError), true);

  let sawInvalidArg = false;
  try {
    throw new MongoInvalidArgumentError("bad option");
  } catch (e) {
    sawInvalidArg = e instanceof MongoInvalidArgumentError;
  }

  assert.strictEqual(sawInvalidArg, true);

  return "PASS: Mongo error hierarchy and labels behave as expected";
};
