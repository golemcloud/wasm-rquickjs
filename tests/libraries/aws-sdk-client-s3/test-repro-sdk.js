import http from "http";

// Simulate the SDK's timing module
const timing = {
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: (id) => clearTimeout(id),
};

// Simulate the SDK's setConnectionTimeout
function setConnectionTimeout(request, reject, timeoutInMs = 0) {
  if (!timeoutInMs) return -1;
  return -1;
}

// Simulate setRequestTimeout
function setRequestTimeout(req, reject, timeoutInMs = 0) {
  if (timeoutInMs) {
    return timing.setTimeout(() => {}, timeoutInMs);
  }
  return -1;
}

// Simulate setSocketTimeout with DEFER pattern
const DEFER_EVENT_LISTENER_TIME = 3000;
function setSocketTimeout(request, reject, timeoutInMs = 0) {
  const registerTimeout = (offset) => {
    const timeout = timeoutInMs - offset;
    if (request.socket) {
      request.socket.setTimeout(timeout, () => {});
    } else {
      request.setTimeout(timeout, () => {});
    }
  };
  if (0 < timeoutInMs && timeoutInMs < 6000) {
    registerTimeout(0);
    return 0;
  }
  return timing.setTimeout(
    registerTimeout.bind(null, timeoutInMs === 0 ? 0 : DEFER_EVENT_LISTENER_TIME),
    DEFER_EVENT_LISTENER_TIME
  );
}

// Simulate writeRequestBody
async function writeRequestBody(httpRequest, body) {
  if (body) {
    httpRequest.end(body);
  } else {
    httpRequest.end();
  }
}

// Simulate NodeHttpHandler.handle() — the SDK pattern
async function handle(options) {
  // Simulate configProvider await
  const config = await Promise.resolve({
    httpAgent: new http.Agent({ keepAlive: true }),
  });

  return new Promise((_resolve, _reject) => {
    let writeRequestBodyPromise = undefined;
    const timeouts = [];

    const resolve = async (arg) => {
      await writeRequestBodyPromise;
      timeouts.forEach(timing.clearTimeout);
      _resolve(arg);
    };

    const reject = async (arg) => {
      await writeRequestBodyPromise;
      timeouts.forEach(timing.clearTimeout);
      _reject(arg);
    };

    const req = http.request(
      {
        method: options.method,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: options.headers || {},
        agent: config.httpAgent,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
          });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    // Set timeouts like the SDK does
    timeouts.push(
      timing.setTimeout(() => {
        // socket acquisition warning
      }, 3000)
    );
    timeouts.push(setConnectionTimeout(req, reject, 0));
    timeouts.push(setRequestTimeout(req, reject, 0));
    timeouts.push(setSocketTimeout(req, reject, 0));

    writeRequestBodyPromise = writeRequestBody(req, options.body).catch(
      (e) => {
        timeouts.forEach(timing.clearTimeout);
        return _reject(e);
      }
    );
  });
}

export const run = async () => {
  // First delete the bucket (ignore errors)
  try {
    await handle({
      method: "DELETE",
      hostname: "127.0.0.1",
      port: 9100,
      path: "/integration-test-bucket-repro",
    });
  } catch (_) {}

  return "PASS: SDK-style HTTP request completed";
};
