import assert from 'assert';
import * as yup from 'yup';

const { addMethod, object, reach, setLocale, string } = yup;

addMethod(string, 'slug', function slug(message = 'slug is invalid') {
  return this.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, message);
});

setLocale({
  mixed: {
    required: '${path} is mandatory',
  },
  string: {
    min: '${path} must have at least ${min} characters',
  },
});

export const run = () => {
  const articleSchema = object({
    title: string().required().min(5),
    slug: string().required().slug(),
  });

  const valid = articleSchema.validateSync({
    title: 'Yup Intro',
    slug: 'yup-intro',
  });
  assert.deepStrictEqual(valid, { title: 'Yup Intro', slug: 'yup-intro' });

  const slugSchema = reach(articleSchema, 'slug');
  assert.strictEqual(slugSchema.describe().type, 'string');

  let err;
  try {
    articleSchema.validateSync({ title: 'abc', slug: 'not a slug' }, { abortEarly: false });
  } catch (e) {
    err = e;
  }
  assert.ok(err, 'expected validation error');
  assert.ok(err.errors.some((message) => message.includes('must have at least 5')));
  assert.ok(err.errors.some((message) => message.includes('slug is invalid')));

  return 'PASS: custom methods, locale overrides, and reach() introspection work';
};
