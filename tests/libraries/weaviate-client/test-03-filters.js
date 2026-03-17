import assert from 'assert';
import weaviate, { Filters } from 'weaviate-client';

export const run = () => {
  const byName = weaviate.filter.byProperty('name').equal('Ada');
  const byScore = weaviate.filter.byProperty('score').greaterOrEqual(10);
  const byRef = weaviate.filter.byRef('author').byProperty('name').like('A*');

  const andFilter = Filters.and(byName, byScore);
  const notFilter = Filters.not(byRef);

  assert.strictEqual(byName.operator, 'Equal');
  assert.strictEqual(byScore.operator, 'GreaterThanEqual');
  assert.strictEqual(byRef.operator, 'Like');
  assert.strictEqual(andFilter.operator, 'And');
  assert.strictEqual(andFilter.filters.length, 2);
  assert.strictEqual(notFilter.operator, 'Not');
  assert.strictEqual(notFilter.filters.length, 1);

  return 'PASS: filter builders produce composable filter objects';
};
