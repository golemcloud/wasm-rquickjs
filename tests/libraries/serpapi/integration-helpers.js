import http from 'node:http';
import qs from 'node:querystring';
import { _internals } from './node_modules/serpapi/esm/src/utils.js';

const createMockExecute = () => (path, parameters = {}, timeout = 60000) =>
  new Promise((resolve, reject) => {
    const cleaned = { ...parameters };
    for (const key of Object.keys(cleaned)) {
      if (key === 'requestOptions' || key === 'timeout' || cleaned[key] === undefined) {
        delete cleaned[key];
      }
    }

    const requestPath = `${path}?${qs.stringify(cleaned)}`;

    let timer;
    const req = http.get(
      {
        hostname: 'localhost',
        port: 18080,
        path: requestPath,
        method: 'GET',
      },
      (res) => {
        res.setEncoding('utf8');
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (timer) {
            clearTimeout(timer);
          }

          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(data);
          }
        });
      },
    );

    req.on('error', (error) => {
      if (timer) {
        clearTimeout(timer);
      }
      reject(error);
    });

    if (timeout > 0) {
      timer = setTimeout(() => {
        req.destroy();
        reject(new Error('Request timeout in integration test transport'));
      }, timeout);
    }
  });

export const withMockHttpTransport = async (runFn) => {
  const originalExecute = _internals.execute;
  _internals.execute = createMockExecute();

  try {
    return await runFn();
  } finally {
    _internals.execute = originalExecute;
  }
};
