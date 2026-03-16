import assert from "assert";
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";

const s3Config = {
  endpoint: "http://127.0.0.1:9100",
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true,
};

const BUCKET = "integration-test-bucket-02";
const KEY = "hello.txt";
const BODY = "Hello from wasm-rquickjs integration test!";

export const run = async () => {
  const client = new S3Client(s3Config);

  // Clean up from any previous run
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));
  } catch (_) {}
  try {
    await client.send(new DeleteBucketCommand({ Bucket: BUCKET }));
  } catch (_) {}

  // Create bucket
  await client.send(new CreateBucketCommand({ Bucket: BUCKET }));

  // Put object
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: BODY,
      ContentType: "text/plain",
    })
  );

  // Get object and verify content
  const getResult = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: KEY })
  );
  const bodyText = await getResult.Body.transformToString();
  assert.strictEqual(bodyText, BODY, `Body mismatch: expected '${BODY}', got '${bodyText}'`);

  // Delete object
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));

  // Delete bucket
  await client.send(new DeleteBucketCommand({ Bucket: BUCKET }));

  return "PASS: PutObject, GetObject (verify content), DeleteObject, DeleteBucket against MinIO";
};
