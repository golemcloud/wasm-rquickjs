import assert from 'assert';
import { EntitySchema } from '@mikro-orm/core';

export const run = () => {
  const ArticleSchema = new EntitySchema({
    name: 'Article',
    tableName: 'articles',
    indexes: [{ properties: ['title'] }],
    uniques: [{ properties: ['slug'] }],
    properties: {
      id: { type: 'number', primary: true },
      title: { type: 'string' },
      slug: { type: 'string', unique: true },
      views: { type: 'number', nullable: true },
    },
  });

  assert.strictEqual(ArticleSchema.meta.className, 'Article');
  assert.strictEqual(ArticleSchema.meta.tableName, 'articles');
  assert.strictEqual(ArticleSchema.meta.properties.id.primary, true);
  assert.strictEqual(ArticleSchema.meta.properties.slug.unique, true);
  assert.strictEqual(ArticleSchema.meta.indexes.length, 1);
  assert.strictEqual(ArticleSchema.meta.uniques.length, 1);

  return 'PASS: EntitySchema captures metadata, indexes, and unique constraints';
};
