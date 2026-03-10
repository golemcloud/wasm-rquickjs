import assert from "assert";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const run = async () => {
  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "SECRETEXAMPLE",
    },
  });

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: "presign-bucket",
      Key: "docs/readme.txt",
    }),
    { expiresIn: 900 },
  );

  assert.ok(url.startsWith("https://presign-bucket.s3."));
  assert.match(url, /X-Amz-Algorithm=AWS4-HMAC-SHA256/);
  assert.match(url, /X-Amz-Credential=AKIDEXAMPLE/);
  assert.match(url, /X-Amz-Expires=900/);

  return "PASS: presigned URL generation works offline with static credentials";
};
