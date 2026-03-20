import assert from 'assert';
import crypto from 'node:crypto';
import { validateWebhook } from 'replicate';

export const run = async () => {
  const secretKey = Buffer.from('test-signing-key').toString('base64');
  const secret = `whsec_${secretKey}`;
  const timestamp = '1700000000';
  const webhookId = 'evt_12345';
  const body = JSON.stringify({ id: webhookId, status: 'completed' });

  const payload = `${webhookId}.${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', Buffer.from(secretKey, 'base64'))
    .update(payload)
    .digest('base64');

  const valid = await validateWebhook({
    id: webhookId,
    timestamp,
    body,
    signature: `v1,${signature}`,
    secret,
  });
  assert.strictEqual(valid, true);

  const invalid = await validateWebhook({
    id: webhookId,
    timestamp,
    body,
    signature: 'v1,invalid-signature',
    secret,
  });
  assert.strictEqual(invalid, false);

  return 'PASS: validateWebhook verifies valid and invalid signatures';
};
