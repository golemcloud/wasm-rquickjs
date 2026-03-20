import assert from 'node:assert';
import express from 'express';
import { dispatch } from './helpers.js';

export const run = async () => {
  const app = express();
  const events = [];

  app.set('case sensitive routing', true);
  app.enable('x-powered-by');
  app.disable('etag');

  assert.strictEqual(app.get('case sensitive routing'), true);
  assert.strictEqual(app.disabled('etag'), true);

  app.use((_req, _res, next) => {
    events.push('middleware');
    next();
  });

  app.get('/hello', (_req, res) => {
    events.push('route');
    res.status(201).set('X-Mode', 'basic').send('hello from express');
  });

  const result = await dispatch(app, {
    method: 'GET',
    url: '/hello',
    headers: {
      host: 'example.test',
    },
  });

  assert.strictEqual(result.statusCode, 201);
  assert.strictEqual(result.body, 'hello from express');
  assert.strictEqual(result.headers['x-mode'], 'basic');
  assert.strictEqual(result.headers['x-powered-by'], 'Express');
  assert.deepStrictEqual(events, ['middleware', 'route']);

  return 'PASS: express app settings and basic middleware routing work';
};
