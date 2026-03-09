export function createRequest(overrides = {}) {
  const base = {
    method: "GET",
    url: "/",
    path: "/",
    headers: {},
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    app: { get: () => false },
  };

  return {
    ...base,
    ...overrides,
    headers: { ...base.headers, ...(overrides.headers || {}) },
    socket: { ...base.socket, ...(overrides.socket || {}) },
    app: overrides.app || base.app,
  };
}

export function createResponse() {
  const listeners = new Map();
  const headers = new Map();

  return {
    headersSent: false,
    statusCode: 200,
    body: undefined,
    headers,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    append(name, value) {
      const key = name.toLowerCase();
      const current = headers.get(key);
      if (current === undefined) {
        headers.set(key, value);
      } else if (Array.isArray(current)) {
        headers.set(key, [...current, value]);
      } else {
        headers.set(key, [current, value]);
      }
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      this.headersSent = true;
      this.emit("finish");
      return this;
    },
    on(event, listener) {
      const eventListeners = listeners.get(event) || [];
      eventListeners.push(listener);
      listeners.set(event, eventListeners);
      return this;
    },
    emit(event, ...args) {
      for (const listener of listeners.get(event) || []) {
        listener(...args);
      }
    },
  };
}

export async function executeMiddleware(middleware, requestOverrides = {}, response = createResponse()) {
  const req = createRequest(requestOverrides);
  const res = response;

  let nextCalls = 0;
  let nextError;

  await middleware(req, res, (err) => {
    nextCalls += 1;
    nextError = err;
  });

  return { req, res, nextCalls, nextError };
}
