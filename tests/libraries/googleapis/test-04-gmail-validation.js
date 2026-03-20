import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = async () => {
  const { google } = googleapisPkg;
  const gmail = google.gmail('v1');

  await assert.rejects(
    () => gmail.users.getProfile({}),
    (error) => {
      assert.ok(error.message.includes('Missing required parameters'));
      assert.ok(error.message.includes('userId'));
      return true;
    },
  );

  return 'PASS: gmail.users.getProfile validates required userId before HTTP';
};
