import assert from "assert";
import { MongoClient } from "mongodb";

export const run = () => {
  const uri = "mongodb://alice:secret@localhost:27017,mydbhost:27018/sample?authSource=admin&readPreference=secondaryPreferred&w=majority";
  const client = new MongoClient(uri, { appName: "mongo-test" });

  assert.strictEqual(client.options.dbName, "sample");
  assert.strictEqual(client.options.appName, "mongo-test");
  assert.strictEqual(client.options.credentials.username, "alice");
  assert.strictEqual(client.options.credentials.source, "admin");
  assert.strictEqual(client.options.readPreference.mode, "secondaryPreferred");
  assert.strictEqual(client.options.writeConcern.w, "majority");

  let parseError = null;
  try {
    new MongoClient("not-a-mongo-uri");
  } catch (e) {
    parseError = e;
  }

  assert.strictEqual(parseError?.name, "MongoParseError");

  return "PASS: MongoClient parses standard mongodb:// options without connecting";
};
