import assert from 'node:assert';
import express from 'express';
import { dispatch } from './helpers.js';

export const run = async () => {
  const app = express();

  app.use(express.json());

  app.post('/echo', (req, res) => {
    res.json({
      sum: req.body.a + req.body.b,
      isJson: req.is('application/json'),
    });
  });

  const result = await dispatch(app, {
    method: 'POST',
    url: '/echo',
    headers: {
      host: 'example.test',
      'content-type': 'application/json',
      'content-length': '13',
    },
    body: '{"a":2,"b":3}',
  });

  assert.strictEqual(result.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(result.body), {
    sum: 5,
    isJson: 'application/json',
  });

  return 'PASS: express.json middleware parses request bodies';
};
