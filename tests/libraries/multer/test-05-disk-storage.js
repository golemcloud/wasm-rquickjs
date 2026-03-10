import assert from 'assert';
import fs from 'fs';
import path from 'path';
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
  const tempDir = path.join(process.cwd(), `multer-lib-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, tempDir),
      filename: (_req, _file, cb) => cb(null, 'saved-file.txt'),
    });

    const upload = multer({ storage }).single('upload');

    const form = new FormData();
    form.append('upload', Buffer.from('disk payload'), {
      filename: 'input.txt',
      contentType: 'text/plain',
    });

    const req = await submitMultipart(upload, form);

    assert.ok(req.file);
    assert.strictEqual(req.file.destination, tempDir);
    assert.strictEqual(req.file.filename, 'saved-file.txt');
    assert.ok(fs.existsSync(req.file.path));

    const saved = fs.readFileSync(req.file.path, 'utf8');
    assert.strictEqual(saved, 'disk payload');

    return 'PASS: diskStorage writes files and reports destination metadata';
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};
