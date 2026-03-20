import assert from 'assert';
import {
  DefaultValuePipe,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe
} from '@nestjs/common';

const metadata = { type: 'query', metatype: String, data: 'value' };

export const run = async () => {
  const parseIntPipe = new ParseIntPipe();
  const parseBoolPipe = new ParseBoolPipe();
  const parseUuidPipe = new ParseUUIDPipe();
  const parseArrayPipe = new ParseArrayPipe({ items: String, separator: ',' });
  const defaultValuePipe = new DefaultValuePipe('fallback');

  assert.strictEqual(await parseIntPipe.transform('42', metadata), 42);
  assert.strictEqual(await parseBoolPipe.transform('true', metadata), true);
  assert.strictEqual(
    await parseUuidPipe.transform('550e8400-e29b-41d4-a716-446655440000', metadata),
    '550e8400-e29b-41d4-a716-446655440000'
  );
  assert.deepStrictEqual(await parseArrayPipe.transform('a,b,c', metadata), ['a', 'b', 'c']);
  assert.strictEqual(defaultValuePipe.transform(undefined), 'fallback');

  await assert.rejects(
    () => parseIntPipe.transform('NaN', metadata),
    (error) => {
      assert.ok(error.message.includes('Validation failed'));
      return true;
    }
  );

  return 'PASS: built-in parsing and default-value pipes transform and validate values';
};
