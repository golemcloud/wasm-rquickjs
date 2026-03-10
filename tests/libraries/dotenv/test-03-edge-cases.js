import assert from 'assert';
import dotenv from 'dotenv';

export const run = () => {
  const parsed = dotenv.parse(
    'SPACED =  value with spaces  # trailing comment\r\n' +
      'EQ=a==b\r' +
      'DUP=one\n' +
      'DUP=two\n',
  );

  assert.strictEqual(parsed.SPACED, 'value with spaces');
  assert.strictEqual(parsed.EQ, 'a==b');
  assert.strictEqual(parsed.DUP, 'two');

  return 'PASS: parse handles spacing, comments, equals signs, CRLF/CR line endings, and duplicate keys';
};
