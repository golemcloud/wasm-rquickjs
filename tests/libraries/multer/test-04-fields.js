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
  const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'docs', maxCount: 2 },
  ]);

  const form = new FormData();
  form.append('title', 'spec package');
  form.append('avatar', Buffer.from('avatar-content'), {
    filename: 'avatar.png',
    contentType: 'image/png',
  });
  form.append('docs', Buffer.from('doc-a'), {
    filename: 'doc-a.txt',
    contentType: 'text/plain',
  });
  form.append('docs', Buffer.from('doc-b'), {
    filename: 'doc-b.txt',
    contentType: 'text/plain',
  });

  const req = await submitMultipart(upload, form);

  assert.strictEqual(req.body.title, 'spec package');
  assert.ok(req.files);
  assert.strictEqual(req.files.avatar.length, 1);
  assert.strictEqual(req.files.docs.length, 2);
  assert.strictEqual(req.files.docs[0].buffer.toString('utf8'), 'doc-a');
  assert.strictEqual(req.files.docs[1].buffer.toString('utf8'), 'doc-b');

  return 'PASS: fields() groups uploaded files by field name';
};
