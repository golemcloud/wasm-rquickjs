import assert from 'assert';
import request from 'superagent';

export const run = () => {
  const agent = request.agent();
  agent.set('X-Agent-Default', 'yes');
  agent.auth('svc', 'token', { type: 'basic' });

  const req = agent
    .get('http://example.com/agent')
    .set('X-Per-Request', '1');

  assert.strictEqual(req.get('X-Agent-Default'), 'yes');
  assert.strictEqual(req.get('X-Per-Request'), '1');
  assert.ok(req.get('Authorization').startsWith('Basic '));

  const snapshot = req.toJSON();
  assert.strictEqual(snapshot.headers['x-agent-default'], 'yes');

  return 'PASS: agent defaults are inherited by subsequent requests';
};
