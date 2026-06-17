const assert = require('node:assert');
const pino = require('pino');
const loglevel = require('loglevel');
const winston = require('winston');

exports.run = () => {
  const logger = pino({ enabled: false }).child({ component: 'installed-app' });
  assert.strictEqual(typeof logger.info, 'function');
  logger.info({ ok: true }, 'disabled logger should not write');

  const log = loglevel.getLogger('installed-app');
  log.setLevel('silent');
  assert.strictEqual(log.getLevel(), loglevel.levels.SILENT);

  const formatted = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ).transform({ level: 'info', message: 'hello' });
  assert.strictEqual(formatted.level, 'info');
  assert.strictEqual(formatted.message, 'hello');
  return 'PASS: pino, loglevel, and winston load without transports/processes';
};
