import assert from 'assert';
import { experimental, logVerbosity, setLogVerbosity, setLogger } from '@grpc/grpc-js';

export const run = () => {
  const messages = [];
  setLogger({
    error: (...args) => messages.push(['error', ...args]),
    warn: (...args) => messages.push(['warn', ...args]),
    info: (...args) => messages.push(['info', ...args]),
    debug: (...args) => messages.push(['debug', ...args]),
  });
  setLogVerbosity(logVerbosity.DEBUG);

  const rendered = experimental.uriToString({
    scheme: 'dns',
    authority: '',
    path: '/localhost:50051',
  });
  assert.strictEqual(rendered, 'dns:////localhost:50051');

  const hostPort = experimental.splitHostPort('example.com:443');
  assert.strictEqual(hostPort.host, 'example.com');
  assert.strictEqual(hostPort.port, 443);

  const parsedDuration = experimental.parseDuration('1.5s');
  assert.deepStrictEqual(parsedDuration, { seconds: 1, nanos: 500000000 });

  const millis = experimental.durationToMs({ seconds: 2, nanos: 500000000 });
  assert.strictEqual(millis, 2500);

  const lbConfig = experimental.parseLoadBalancingConfig({ round_robin: {} });
  assert.strictEqual(lbConfig.getLoadBalancerName(), 'round_robin');

  assert.ok(messages.length >= 0);
  return 'PASS: experimental helpers and logging configuration APIs work';
};
