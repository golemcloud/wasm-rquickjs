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
  const upload = multer({ storage: multer.memoryStorage() }).single('avatar');

  const form = new FormData();
  form.append('username', 'alice');
  form.append('avatar', Buffer.from('hello multer'), {
    filename: 'avatar.txt',
    contentType: 'text/plain',
  });

  const req = await submitMultipart(upload, form);

  assert.strictEqual(req.body.username, 'alice');
  assert.ok(req.file);
  assert.strictEqual(req.file.fieldname, 'avatar');
  assert.strictEqual(req.file.originalname, 'avatar.txt');
  assert.strictEqual(req.file.mimetype, 'text/plain');
  assert.strictEqual(req.file.buffer.toString('utf8'), 'hello multer');

  return 'PASS: single() parses body and in-memory file metadata';
};
