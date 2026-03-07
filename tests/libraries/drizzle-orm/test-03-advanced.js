import assert from 'assert';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  normalizeRelation,
  relations,
} from 'drizzle-orm';

export const run = () => {
  const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
  });

  const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    authorId: integer('author_id').notNull().references(() => users.id),
    title: text('title').notNull(),
  });

  const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
  }));

  const postsRelations = relations(posts, ({ one }) => ({
    author: one(users, {
      fields: [posts.authorId],
      references: [users.id],
    }),
  }));

  const relational = extractTablesRelationalConfig(
    { users, posts, usersRelations, postsRelations },
    createTableRelationsHelpers,
  );

  assert.deepStrictEqual(Object.keys(relational.tables).sort(), ['posts', 'users']);

  const normalized = normalizeRelation(
    relational.tables,
    relational.tableNamesMap,
    relational.tables.users.relations.posts,
  );

  assert.deepStrictEqual(normalized.fields.map((field) => field.name), ['id']);
  assert.deepStrictEqual(normalized.references.map((field) => field.name), ['author_id']);

  return 'PASS: relations metadata can be extracted and normalized without a live database';
};
