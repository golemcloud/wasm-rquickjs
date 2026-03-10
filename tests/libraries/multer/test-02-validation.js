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
    fileFilter: (_req, file, cb) => {
      cb(null, file.mimetype.startsWith('image/'));
    },
  }).single('avatar');

  const form = new FormData();
  form.append('role', 'tester');
  form.append('avatar', Buffer.from('not an image'), {
    filename: 'avatar.txt',
    contentType: 'text/plain',
  });

  const req = await submitMultipart(upload, form);

  assert.strictEqual(req.body.role, 'tester');
  assert.strictEqual(req.file, undefined);

  return 'PASS: fileFilter can reject files while preserving text fields';
};
