import assert from "node:assert";
import {
  ArangoError,
  NetworkError,
  RequestAbortedError,
  ResponseTimeoutError,
  isArangoError,
  isNetworkError,
} from "arangojs/errors";

export const run = () => {
  const request = new Request("http://127.0.0.1:18529/_api/version");

  const networkError = new NetworkError("network down", request, { isSafeToRetry: true });
  const timeoutError = new ResponseTimeoutError(undefined, request);
  const abortedError = new RequestAbortedError(undefined, request);
  const arangoError = new ArangoError(
    {
      error: true,
      code: 409,
      errorNum: 1200,
      errorMessage: "write conflict",
    },
    { cause: networkError },
  );

  assert.strictEqual(isNetworkError(networkError), true);
  assert.strictEqual(isArangoError(arangoError), true);
  assert.strictEqual(networkError.isSafeToRetry, true);
  assert.strictEqual(timeoutError.name, "ResponseTimeoutError");
  assert.strictEqual(abortedError.name, "RequestAbortedError");
  assert.strictEqual(arangoError.code, 409);
  assert.strictEqual(arangoError.errorNum, 1200);
  assert.strictEqual(arangoError.isSafeToRetry, true);

  return "PASS: arangojs error classes preserve retry and metadata semantics";
};
