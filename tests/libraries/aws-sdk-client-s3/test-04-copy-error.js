import assert from "assert";
import { CopyObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const run = async () => {
  const requestHandler = {
    handle: async () => ({
      response: {
        statusCode: 200,
        headers: {
          "content-type": "application/xml",
        },
        body: new TextEncoder().encode(
          "<CopyObjectResult><ETag>\"copied-etag\"</ETag><LastModified>2024-01-01T00:00:00.000Z</LastModified></CopyObjectResult>",
        ),
      },
    }),
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
    new CopyObjectCommand({
      Bucket: "target-bucket",
      Key: "copied.txt",
      CopySource: "source-bucket/original.txt",
    }),
  );

  assert.ok(output.CopyObjectResult);
  assert.strictEqual(output.CopyObjectResult.ETag, '"copied-etag"');
  assert.strictEqual(output.CopyObjectResult.LastModified?.toISOString(), "2024-01-01T00:00:00.000Z");

  return "PASS: CopyObject XML response is parsed into structured output";
};
