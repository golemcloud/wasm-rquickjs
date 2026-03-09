import assert from 'assert';
import passportJwt from 'passport-jwt';

const { ExtractJwt } = passportJwt;

export const run = () => {
  const req = {
    method: 'GET',
    url: '/resource?token=query-token',
    headers: {
      authorization: 'Bearer bearer-token',
      'x-auth-token': 'header-token',
    },
    body: {
      token: 'body-token',
    },
  };

  assert.strictEqual(ExtractJwt.fromHeader('x-auth-token')(req), 'header-token');
  assert.strictEqual(ExtractJwt.fromBodyField('token')(req), 'body-token');
  assert.strictEqual(ExtractJwt.fromUrlQueryParameter('token')(req), 'query-token');
  assert.strictEqual(ExtractJwt.fromAuthHeaderAsBearerToken()(req), 'bearer-token');
  assert.strictEqual(
    ExtractJwt.fromAuthHeaderWithScheme('JWT')({ headers: { authorization: 'JWT legacy-token' } }),
    'legacy-token',
  );
  assert.strictEqual(ExtractJwt.fromHeader('missing')(req), null);

  return 'PASS: basic extractors read header/body/query/auth-header inputs';
};
