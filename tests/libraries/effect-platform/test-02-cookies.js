import assert from 'node:assert';
import { Cookies } from '@effect/platform';
import { Either, Option } from 'effect';

export const run = () => {
  const sessionCookie = Cookies.unsafeMakeCookie('session', 'abc123', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });

  const themeEither = Cookies.makeCookie('theme', 'dark', {
    path: '/',
    secure: true,
  });
  assert.ok(Either.isRight(themeEither));

  let jar = Cookies.setCookie(Cookies.empty, sessionCookie);
  jar = Cookies.setCookie(jar, themeEither.right);

  const sessionValue = Option.match(Cookies.getValue(jar, 'session'), {
    onNone: () => '',
    onSome: (value) => value,
  });
  assert.strictEqual(sessionValue, 'abc123');

  const cookieHeader = Cookies.toCookieHeader(jar);
  assert.ok(cookieHeader.includes('session=abc123'));
  assert.ok(cookieHeader.includes('theme=dark'));

  const setCookieHeaders = Cookies.toSetCookieHeaders(jar);
  assert.strictEqual(setCookieHeaders.length, 2);
  assert.ok(setCookieHeaders.some((header) => header.startsWith('session=')));
  assert.ok(setCookieHeaders.some((header) => header.startsWith('theme=')));

  const withoutTheme = Cookies.remove(jar, 'theme');
  const removedTheme = Cookies.get(withoutTheme, 'theme');
  assert.strictEqual(
    Option.match(removedTheme, {
      onNone: () => 'none',
      onSome: () => 'some',
    }),
    'none'
  );

  return 'PASS: Cookies creation, lookup, serialization, and removal work';
};
