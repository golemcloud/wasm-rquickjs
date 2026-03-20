import assert from 'assert';
import weaviate, { generateUuid5 } from 'weaviate-client';

export const run = () => {
  const articleVectorizer = weaviate.configure.vectorizer.none();
  const schemaConfig = {
    name: 'Article',
    properties: [
      { name: 'title', dataType: weaviate.configure.dataType.TEXT },
      { name: 'published', dataType: weaviate.configure.dataType.DATE },
    ],
    vectorizers: articleVectorizer,
    multiTenancy: weaviate.configure.multiTenancy({ enabled: true }),
  };

  assert.strictEqual(schemaConfig.name, 'Article');
  assert.strictEqual(schemaConfig.properties[0].dataType, 'text');
  assert.ok(schemaConfig.vectorizers.vectorizer);
  assert.strictEqual(schemaConfig.multiTenancy.enabled, true);

  const idA = generateUuid5('article-123');
  const idB = generateUuid5('article-123');
  const idC = generateUuid5('article-124');

  assert.strictEqual(idA, idB);
  assert.notStrictEqual(idA, idC);
  assert.match(idA, /^[0-9a-f-]{36}$/);

  return 'PASS: configure helpers and UUID generation work as expected';
};
