import { Writable } from "stream";
import zlib from "zlib";

const normalizeHeaders = (headers = {}) => {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
};

class MockResponse extends Writable {
  constructor(headers = {}) {
    super();
    this.statusCode = 200;
    this.headersSent = false;
    this._header = false;
    this._headers = new Map();
    this._chunks = [];

    for (const [key, value] of Object.entries(headers)) {
      this.setHeader(key, value);
    }
  }

  _write(chunk, _encoding, callback) {
    this._chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  writeHead(statusCode) {
    this.statusCode = statusCode;
    this.headersSent = true;
    this._header = true;
    return this;
  }

  setHeader(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }

  appendHeader(name, value) {
    const key = name.toLowerCase();
    const existing = this._headers.get(key);
    if (existing === undefined) {
      this._headers.set(key, value);
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      this._headers.set(key, existing);
      return;
    }

    this._headers.set(key, [existing, value]);
  }

  getHeader(name) {
    return this._headers.get(name.toLowerCase());
  }

  removeHeader(name) {
    this._headers.delete(name.toLowerCase());
  }

  getBody() {
    return Buffer.concat(this._chunks);
  }

  getHeadersObject() {
    return Object.fromEntries(this._headers.entries());
  }
}

export const runCompressionScenario = async ({
  middleware,
  method = "GET",
  reqHeaders = {},
  resHeaders = {},
  body = "",
}) => {
  const req = {
    method,
    headers: normalizeHeaders(reqHeaders),
  };
  const res = new MockResponse(resHeaders);

  await new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);

    middleware(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        if (body === undefined) {
          res.end();
        } else {
          res.end(body);
        }
      } catch (error) {
        reject(error);
      }
    });
  });

  return {
    headers: res.getHeadersObject(),
    body: res.getBody(),
  };
};

export const decodeBody = ({ headers, body }) => {
  const encoding = headers["content-encoding"];

  if (encoding === "gzip") {
    return zlib.gunzipSync(body).toString("utf8");
  }

  if (encoding === "deflate") {
    return zlib.inflateSync(body).toString("utf8");
  }

  if (encoding === "br") {
    return zlib.brotliDecompressSync(body).toString("utf8");
  }

  return body.toString("utf8");
};
