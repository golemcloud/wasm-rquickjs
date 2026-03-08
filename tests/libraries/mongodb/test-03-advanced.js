import assert from "assert";
import { MongoInvalidArgumentError, ReadConcern, ReadPreference, WriteConcern } from "mongodb";

export const run = () => {
  const rp = new ReadPreference("secondary", [{ region: "eu" }], { maxStalenessSeconds: 120 });
  assert.strictEqual(rp.mode, "secondary");
  assert.strictEqual(ReadPreference.isValid("nearest"), true);

  const rc = ReadConcern.fromOptions({ readConcern: { level: "majority" } });
  assert.strictEqual(rc.level, "majority");

  const wc = new WriteConcern("majority", 5000, true);
  const command = {};
  WriteConcern.apply(command, wc);
  assert.strictEqual(command.writeConcern.w, "majority");
  assert.strictEqual(command.writeConcern.j, true);
  assert.strictEqual(command.writeConcern.wtimeout, 5000);

  let invalidModeError = null;
  try {
    new ReadPreference("invalid");
  } catch (e) {
    invalidModeError = e;
  }

  assert.ok(invalidModeError instanceof MongoInvalidArgumentError);

  return "PASS: Read/Write concern and preference constructors validate input";
};
