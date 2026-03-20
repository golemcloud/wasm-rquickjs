import assert from 'assert';
import { K, Limit, Select, toSearch } from 'chromadb';

export const run = () => {
  const where = K('score').gte(0.5).and(K.DOCUMENT.contains('hello'));
  assert.deepStrictEqual(where.toJSON(), {
    $and: [
      { score: { $gte: 0.5 } },
      { '#document': { $contains: 'hello' } },
    ],
  });

  const limit = Limit.from({ offset: 2, limit: 5 });
  assert.deepStrictEqual(limit.toJSON(), { offset: 2, limit: 5 });

  const select = Select.from(['id', K('category')]);
  assert.deepStrictEqual(select.toJSON(), { keys: ['id', 'category'] });

  const search = toSearch({
    where: K('lang').eq('en'),
    limit: 3,
    select: ['id', 'document'],
  });

  assert.deepStrictEqual(search.toPayload(), {
    limit: {
      offset: 0,
      limit: 3,
    },
    select: {
      keys: ['id', 'document'],
    },
    filter: {
      lang: { $eq: 'en' },
    },
  });

  return 'PASS: where/filter/search builder utilities produce stable JSON payloads';
};
