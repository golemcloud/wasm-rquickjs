import assert from "assert";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const run = () => {
  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "SECRETEXAMPLE",
    },
  });

  assert.strictEqual(typeof client.send, "function");
  assert.strictEqual(client.config.disableHostPrefix, false);

  const command = new PutObjectCommand({
    Bucket: "demo-bucket",
    Key: "hello.txt",
    Body: "hello world",
    ContentType: "text/plain",
  });

  assert.strictEqual(command.input.Bucket, "demo-bucket");
  assert.strictEqual(command.input.Key, "hello.txt");

  const endpointInstructions = PutObjectCommand.getEndpointParameterInstructions();
  assert.ok(endpointInstructions.Bucket);
  assert.ok(endpointInstructions.ForcePathStyle);
  assert.ok(endpointInstructions.DisableMultiRegionAccessPoints);

  return "PASS: S3 client construction and command metadata work";
};
