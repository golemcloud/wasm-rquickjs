import assert from 'assert';
import { EntityCaseNamingStrategy, UnderscoreNamingStrategy } from '@mikro-orm/core';

export const run = () => {
  const underscore = new UnderscoreNamingStrategy();
  const entityCase = new EntityCaseNamingStrategy();

  assert.strictEqual(underscore.classToTableName('BlogPost'), 'blog_post');
  assert.strictEqual(underscore.joinKeyColumnName('author'), 'author_id');
  assert.strictEqual(underscore.joinTableName('BlogPost', 'Tag', 'tags'), 'blog_post_tags');

  assert.strictEqual(entityCase.classToTableName('BlogPost'), 'BlogPost');
  assert.strictEqual(entityCase.propertyToColumnName('createdAt'), 'createdAt');

  return 'PASS: Naming strategies produce stable table and column names';
};
