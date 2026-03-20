import assert from 'assert';
import mongoose from 'mongoose';

const slugPlugin = (schema) => {
  schema.add({ slug: String });
  schema.method('buildSlug', function buildSlug() {
    return this.title.toLowerCase().replace(/\s+/g, '-');
  });
};

export const run = () => {
  const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
  });

  articleSchema.plugin(slugPlugin);
  const Article = mongoose.model('MongooseLibPluginArticle', articleSchema);

  const article = new Article({ title: 'Hello Mongoose Runtime', body: 'Body text' });
  article.slug = article.buildSlug();
  const err = article.validateSync();

  assert.strictEqual(err, undefined);
  assert.strictEqual(article.slug, 'hello-mongoose-runtime');

  return 'PASS: schema plugin and instance methods work offline';
};
