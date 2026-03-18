import http from 'node:http';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const requestJson = (method, path, body = null) => new Promise((resolve, reject) => {
  const request = http.request(
    {
      host: 'localhost',
      port: 18080,
      method,
      path,
      headers: body == null
        ? {}
        : {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
    },
    (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        responseBody += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          json: responseBody ? JSON.parse(responseBody) : {},
        });
      });
    },
  );

  request.on('error', reject);
  if (body != null) {
    request.write(body);
  }
  request.end();
});

export const resetState = async () => {
  const response = await requestJson('POST', '/reset', JSON.stringify({ reset: true }));
  if (response.statusCode !== 200) {
    throw new Error(`Expected reset status 200, got ${response.statusCode}`);
  }
};

export const getState = async () => {
  const response = await requestJson('GET', '/state');
  if (response.statusCode !== 200) {
    throw new Error(`Expected state status 200, got ${response.statusCode}`);
  }
  return response.json;
};

export const waitFor = async (predicate, timeoutMs = 8000, intervalMs = 100) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }
    await wait(intervalMs);
  }
  throw new Error(`Condition was not met within ${timeoutMs}ms`);
};

export const flushTracer = async (tracer) => {
  if (typeof tracer.flush !== 'function') {
    return;
  }

  await new Promise((resolve, reject) => {
    tracer.flush((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};
