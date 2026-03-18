import assert from 'assert';
import { DiagLogLevel, diag } from '@opentelemetry/api';

class CapturingLogger {
  constructor() {
    this.records = [];
  }

  error(message, ...args) {
    this.records.push({ level: 'error', message, args });
  }

  warn(message, ...args) {
    this.records.push({ level: 'warn', message, args });
  }

  info(message, ...args) {
    this.records.push({ level: 'info', message, args });
  }

  debug(message, ...args) {
    this.records.push({ level: 'debug', message, args });
  }

  verbose(message, ...args) {
    this.records.push({ level: 'verbose', message, args });
  }
}

export const run = () => {
  const logger = new CapturingLogger();
  diag.setLogger(logger, { logLevel: DiagLogLevel.ALL, suppressOverrideMessage: true });

  diag.error('diag-error', 1);
  diag.warn('diag-warn', 2);
  diag.info('diag-info', 3);
  diag.debug('diag-debug', 4);
  diag.verbose('diag-verbose', 5);

  const componentLogger = diag.createComponentLogger({ namespace: 'test.namespace' });
  componentLogger.info('component-info');

  const messages = logger.records.map((record) => record.message);
  assert.ok(messages.includes('diag-error'));
  assert.ok(messages.includes('diag-warn'));
  assert.ok(messages.includes('diag-info'));
  assert.ok(messages.includes('diag-debug'));
  assert.ok(messages.includes('diag-verbose'));
  assert.ok(messages.some((message) => String(message).includes('test.namespace')));

  diag.disable();

  return 'PASS: diag API routes logs through custom and component loggers';
};
