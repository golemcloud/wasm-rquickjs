import assert from 'assert';
import Mustache from 'mustache';

export const run = () => {
  const loopTemplate = '{{#users}}{{name}}:{{role}};{{/users}}{{^users}}no-users{{/users}}';

  const withUsers = Mustache.render(loopTemplate, {
    users: [
      { name: 'alice', role: 'admin' },
      { name: 'bob', role: 'reader' },
    ],
  });
  assert.strictEqual(withUsers, 'alice:admin;bob:reader;');

  const withoutUsers = Mustache.render(loopTemplate, { users: [] });
  assert.strictEqual(withoutUsers, 'no-users');

  const dotted = Mustache.render('team={{company.team.name}}', {
    company: { team: { name: 'runtime' } },
  });
  assert.strictEqual(dotted, 'team=runtime');

  return 'PASS: sections, inverted sections, and dotted-name lookup work';
};
