import assert from 'assert';
import multer from 'multer';
import FormData from 'form-data';
import { PassThrough } from 'stream';

const submitMultipart = async (middleware, form) => {
  const length = await new Promise((resolve, reject) => {
    form.getLength((err, value) => (err ? reject(err) : resolve(value)));
  });

  const req = new PassThrough();
  req.headers = {
    'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
    'content-length': String(length),
  };

  form.pipe(req);

  await new Promise((resolve, reject) => {
    middleware(req, null, (err) => (err ? reject(err) : resolve()));
  });

  return req;
};

export const run = async () => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 },
  }).single('avatar');

  const form = new FormData();
  form.append('avatar', Buffer.from('too big for the limit'), {
    filename: 'avatar.txt',
    contentType: 'text/plain',
  });

  let error;
  try {
    await submitMultipart(upload, form);
  } catch (err) {
    error = err;
  }

  assert.ok(error, 'Expected multer to reject oversized file');
  assert.ok(error instanceof multer.MulterError, 'Expected MulterError');
  assert.strictEqual(error.code, 'LIMIT_FILE_SIZE');

  return 'PASS: limits.fileSize raises MulterError with LIMIT_FILE_SIZE';
};
