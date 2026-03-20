import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = async () => {
  const { google } = googleapisPkg;
  const drive = google.drive('v3');

  await assert.rejects(
    () => drive.files.get({}),
    (error) => {
      assert.ok(error.message.includes('Missing required parameters'));
      assert.ok(error.message.includes('fileId'));
      return true;
    },
  );

  return 'PASS: drive.files.get validates required fileId before HTTP';
};
