import assert from "assert";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

export const run = async () => {
  let requestHandlerCalled = false;

  const requestHandler = {
    handle: async () => {
      requestHandlerCalled = true;
      return {
        response: {
          statusCode: 200,
          headers: {},
          body: new Uint8Array(),
        },
      };
    },
  };

  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "SECRETEXAMPLE",
    },
    requestHandler,
  });

  await assert.rejects(
    () => client.send(new ListObjectsV2Command({ Bucket: "invalid/bucket", Prefix: "x" })),
    (error) => {
      assert.ok(error);
      assert.strictEqual(error.name, "InvalidBucketName");
      assert.match(error.message, /Bucket name shouldn't contain '\/'/);
      return true;
    },
  );

  assert.strictEqual(requestHandlerCalled, false);
  return "PASS: invalid bucket names are rejected before network send";
};
