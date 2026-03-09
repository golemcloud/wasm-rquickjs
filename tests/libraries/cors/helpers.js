export const createMockResponse = () => {
  const headers = new Map();

  return {
    statusCode: 200,
    ended: false,
    body: undefined,

    getHeader(key) {
      return headers.get(String(key).toLowerCase());
    },

    setHeader(key, value) {
      headers.set(String(key).toLowerCase(), String(value));
    },

    end(chunk) {
      this.ended = true;
      this.body = chunk;
    },
  };
};

export const runMiddleware = (middleware, request) => {
  const req = {
    method: "GET",
    headers: {},
    ...request,
  };

  if (!req.headers) {
    req.headers = {};
  }

  const res = createMockResponse();
  let nextCalled = 0;
  let nextError;

  middleware(req, res, (err) => {
    nextCalled += 1;
    if (err) {
      nextError = err;
    }
  });

  return { req, res, nextCalled, nextError };
};
