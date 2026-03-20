import assert from 'assert';
import passportJwt from 'passport-jwt';

const { ExtractJwt } = passportJwt;

export const run = () => {
  assert.throws(
    () => ExtractJwt.fromExtractors('not-an-array'),
    /expects an array/,
  );

  const chained = ExtractJwt.fromExtractors([
    ExtractJwt.fromHeader('x-token'),
    ExtractJwt.fromBodyField('jwt'),
    ExtractJwt.fromUrlQueryParameter('jwt'),
  ]);

  const reqFromBody = {
    method: 'POST',
    url: '/submit?jwt=query-value',
    headers: {},
    body: { jwt: 'body-value' },
  };
  assert.strictEqual(chained(reqFromBody), 'body-value');

  const reqFromQuery = {
    method: 'GET',
    url: '/submit?jwt=query-value',
    headers: {},
    body: {},
  };
  assert.strictEqual(chained(reqFromQuery), 'query-value');

  const v1Extractor = ExtractJwt.versionOneCompatibility({});
  assert.strictEqual(
    v1Extractor({
      method: 'GET',
      url: '/legacy?auth_token=query-auth-token',
      headers: {},
      body: {},
    }),
    'query-auth-token',
  );

  assert.strictEqual(
    v1Extractor({
      method: 'POST',
      url: '/legacy',
      headers: { authorization: 'JWT header-auth-token' },
      body: { auth_token: 'body-auth-token' },
    }),
    'header-auth-token',
  );

  return 'PASS: extractor validation, chaining, and v1 compatibility fallback work';
};
