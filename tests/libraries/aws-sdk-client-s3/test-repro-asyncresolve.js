import http from "http";

async function writeRequestBody(httpRequest, body) {
  if (body) {
    httpRequest.end(body);
  } else {
    httpRequest.end();
  }
}

async function handle(options) {
  const config = await Promise.resolve({ httpAgent: undefined });

  return new Promise((_resolve, _reject) => {
    let writeRequestBodyPromise = undefined;
    const timeouts = [];

    // SDK pattern: async resolve that awaits writeRequestBodyPromise
    const resolve = async (arg) => {
      await writeRequestBodyPromise;
      timeouts.forEach(clearTimeout);
      _resolve(arg);
    };

    const reject = async (arg) => {
      await writeRequestBodyPromise;
      timeouts.forEach(clearTimeout);
      _reject(arg);
    };

    const req = http.request(
      {
        method: options.method,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    timeouts.push(setTimeout(() => {}, 3000));

    writeRequestBodyPromise = writeRequestBody(req, options.body).catch(
      (e) => {
        timeouts.forEach(clearTimeout);
        return _reject(e);
      }
    );
  });
}

export const run = async () => {
  try {
    const result = await handle({
      method: "DELETE",
      hostname: "127.0.0.1",
      port: 9100,
      path: "/integration-test-bucket-repro",
    });
    return `PASS: status=${result.statusCode}`;
  } catch (e) {
    return `PASS: caught ${e.message || e}`;
  }
};
