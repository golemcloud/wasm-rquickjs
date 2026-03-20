import { EventEmitter } from 'node:events';
import https from 'node:https';
import { config } from 'serpapi';

export const resetConfig = () => {
  config.api_key = undefined;
  config.timeout = undefined;
  config.requestOptions = undefined;
};

export const withMockHttpsGet = async (responsePlans, runFn) => {
  const plans = Array.isArray(responsePlans) ? responsePlans : [responsePlans];
  const originalGet = https.get;
  const calls = [];
  let callIndex = 0;

  https.get = (options, callback) => {
    calls.push(options);
    const plan = plans[callIndex++] || { statusCode: 200, body: '' };
    const req = new EventEmitter();

    req.destroy = () => {
      req.destroyed = true;
    };

    process.nextTick(() => {
      if (plan.error) {
        req.emit('error', plan.error);
        return;
      }

      const resp = new EventEmitter();
      resp.statusCode = plan.statusCode ?? 200;
      resp.setEncoding = () => {};
      callback(resp);

      const bodyChunks = plan.bodyChunks ?? [plan.body ?? ''];
      const emitBody = () => {
        for (const chunk of bodyChunks) {
          resp.emit('data', chunk);
        }
        resp.emit('end');
      };

      if (plan.delayMs) {
        setTimeout(emitBody, plan.delayMs);
      } else {
        process.nextTick(emitBody);
      }
    });

    return req;
  };

  try {
    return await runFn(calls);
  } finally {
    https.get = originalGet;
  }
};
