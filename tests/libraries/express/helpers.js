import http from 'node:http';
import { Buffer } from 'node:buffer';
import { PassThrough } from 'node:stream';

const normalizeHeaders = (headers) => {
  const normalized = {};
  for (const [name, value] of Object.entries(headers)) {
    normalized[name.toLowerCase()] = value;
  }
  return normalized;
};

const toBuffer = (body) => {
  if (body === undefined || body === null) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  return Buffer.from(String(body));
};

const toChunkBuffer = (chunk, encoding) => {
  if (chunk === undefined || chunk === null) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }
  return Buffer.from(String(chunk), typeof encoding === 'string' ? encoding : undefined);
};

export const headerToArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value === undefined) {
    return [];
  }
  return [String(value)];
};

export const dispatch = (app, {
  method = 'GET',
  url = '/',
  headers = {},
  body,
} = {}) => new Promise((resolve, reject) => {
  const socket = new PassThrough();
  socket.remoteAddress = '127.0.0.1';
  socket.encrypted = false;

  const req = new http.IncomingMessage(socket);
  req.method = method;
  req.url = url;
  req.headers = normalizeHeaders(headers);
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  req.connection = socket;

  const res = new http.ServerResponse(req);
  res.assignSocket(socket);

  const bodyChunks = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = (chunk, encoding, callback) => {
    const chunkBuffer = toChunkBuffer(chunk, encoding);
    if (chunkBuffer.length > 0) {
      bodyChunks.push(chunkBuffer);
    }
    return originalWrite(chunk, encoding, callback);
  };

  res.end = (chunk, encoding, callback) => {
    const chunkBuffer = toChunkBuffer(chunk, encoding);
    if (chunkBuffer.length > 0) {
      bodyChunks.push(chunkBuffer);
    }
    return originalEnd(chunk, encoding, callback);
  };

  const finalize = () => {
    resolve({
      req,
      res,
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: Buffer.concat(bodyChunks).toString('utf8'),
    });
  };

  res.once('finish', finalize);
  res.once('error', reject);

  try {
    app.handle(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      if (!res.writableEnded) {
        res.statusCode = res.statusCode || 404;
        res.end();
      }
    });
  } catch (error) {
    reject(error);
    return;
  }

  const bodyBuffer = toBuffer(body);
  if (bodyBuffer.length > 0) {
    req.push(bodyBuffer);
  }
  req.push(null);
});
