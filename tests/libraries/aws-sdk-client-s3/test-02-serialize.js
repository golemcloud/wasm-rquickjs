import assert from "assert";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const run = async () => {
  let capturedRequest;

  const requestHandler = {
    handle: async (request) => {
      capturedRequest = request;
      return {
        response: {
          statusCode: 200,
          headers: {
            etag: '"etag-value"',
          },
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

  const output = await client.send(
    new PutObjectCommand({
      Bucket: "example-bucket",
      Key: "folder/data.txt",
      Body: "hello",
      ContentType: "text/plain",
    }),
  );

  assert.ok(capturedRequest);
  assert.strictEqual(capturedRequest.method, "PUT");
  assert.ok(capturedRequest.path.endsWith("/folder/data.txt"));
  assert.ok(capturedRequest.hostname.includes("example-bucket"));
  assert.strictEqual(output.ETag, '"etag-value"');

  return "PASS: PutObject serializes request and deserializes ETag";
};
