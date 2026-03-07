import assert from 'node:assert';
import express from 'express';
import { dispatch, headerToArray } from './helpers.js';

export const run = async () => {
  const app = express();

  app.get('/meta', (_req, res) => {
    res.append('X-Trace', 'step-1');
    res.append('X-Trace', 'step-2');
    res.cookie('sid', 'abc', { httpOnly: true, maxAge: 1_000 });
    res.location('/next');
    res.type('application/json');
    res.send(JSON.stringify({ ok: true }));
  });

  const result = await dispatch(app, {
    method: 'GET',
    url: '/meta',
    headers: {
      host: 'example.test',
    },
  });

  assert.strictEqual(result.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(result.body), { ok: true });

  const traceValues = headerToArray(result.headers['x-trace']);
  assert.strictEqual(traceValues.join(','), 'step-1,step-2');

  const cookieValues = headerToArray(result.headers['set-cookie']);
  assert(cookieValues.some((entry) => entry.includes('sid=abc')));
  assert.strictEqual(result.headers.location, '/next');
  assert(String(result.headers['content-type']).includes('application/json'));

  return 'PASS: express response helper methods set headers and cookies';
};
