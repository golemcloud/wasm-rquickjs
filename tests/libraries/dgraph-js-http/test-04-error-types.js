import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = () => {
  const apiError = new dgraph.APIError('http://localhost:18080/query', [{ message: 'bad query' }]);
  assert.strictEqual(apiError.name, 'APIError');
  assert.strictEqual(apiError.message, 'bad query');
  assert.strictEqual(apiError.url, 'http://localhost:18080/query');
  assert.strictEqual(apiError.errors.length, 1);

  const response = new Response('server error', { status: 503 });
  const httpError = new dgraph.HTTPError(response);
  assert.strictEqual(httpError.name, 'HTTPError');
  assert.strictEqual(httpError.message, 'Invalid status code = 503');
  assert.strictEqual(httpError.errorResponse.status, 503);

  return 'PASS: APIError and HTTPError expose expected fields';
};
