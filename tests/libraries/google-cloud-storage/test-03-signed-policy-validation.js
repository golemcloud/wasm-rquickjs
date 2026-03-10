import assert from "assert";
import { Storage } from "@google-cloud/storage";

export const run = async () => {
  const storage = new Storage({ projectId: "demo-project" });
  const file = storage.bucket("demo-bucket").file("doc.txt");

  const future = new Date(Date.now() + 60_000);
  const farFuture = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

  await assert.rejects(
    () => file.generateSignedPostPolicyV2({ expires: "not-a-date" }),
    /expiration date provided was invalid/i,
  );

  await assert.rejects(
    () => file.generateSignedPostPolicyV2({ expires: new Date(Date.now() - 60_000) }),
    /cannot be in the past/i,
  );

  await assert.rejects(
    () => file.generateSignedPostPolicyV2({
      expires: future,
      equals: ["single"],
    }),
    /array of 2 elements/i,
  );

  await assert.rejects(
    () => file.generateSignedPostPolicyV4({ expires: farFuture }),
    /max allowed expiration is seven days/i,
  );

  return "PASS: signed policy validation guards trigger before network/auth";
};
