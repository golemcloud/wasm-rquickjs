import assert from "assert";
import {
  S3Client,
  CreateBucketCommand,
  ListBucketsCommand,
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

const BUCKET = "integration-test-bucket-01";

export const run = async () => {
  const client = new S3Client(s3Config);

  // Clean up in case a previous run left the bucket around
  try {
    await client.send(new DeleteBucketCommand({ Bucket: BUCKET }));
  } catch (_) {
    // ignore – bucket may not exist
  }

  // Create bucket
  await client.send(new CreateBucketCommand({ Bucket: BUCKET }));

  // List buckets and verify ours is present
  const list = await client.send(new ListBucketsCommand({}));
  const names = (list.Buckets || []).map((b) => b.Name);
  assert.ok(names.includes(BUCKET), `Expected '${BUCKET}' in bucket list, got: ${names}`);

  // Delete bucket
  await client.send(new DeleteBucketCommand({ Bucket: BUCKET }));

  // Verify it's gone
  const list2 = await client.send(new ListBucketsCommand({}));
  const names2 = (list2.Buckets || []).map((b) => b.Name);
  assert.ok(!names2.includes(BUCKET), `Bucket '${BUCKET}' should have been deleted`);

  return "PASS: CreateBucket, ListBuckets, DeleteBucket against MinIO";
};
