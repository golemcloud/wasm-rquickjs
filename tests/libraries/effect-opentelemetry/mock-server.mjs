import http from "node:http";

const PORT = 18080;

const initialState = () => ({
  traces: {
    requests: 0,
    successRequests: 0,
    failedRequests: 0,
    parsedPayloads: 0,
    lastHeaders: {},
    lastServiceName: null,
  },
});

let state = initialState();

const readBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    resolve(body);
  });
  req.on("error", reject);
});

const sendJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = `${req.method} ${url.pathname}`;

  if (route === "GET /health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (route === "POST /reset") {
    state = initialState();
    sendJson(res, 200, { reset: true });
    return;
  }

  if (route === "GET /stats") {
    sendJson(res, 200, state);
    return;
  }

  if (route === "POST /v1/traces") {
    state.traces.requests += 1;
    state.traces.lastHeaders = req.headers;

    const raw = await readBody(req);
    if (raw.length > 0 && req.headers["content-type"]?.includes("application/json")) {
      try {
        const parsed = JSON.parse(raw);
        const serviceName = parsed?.resourceSpans?.[0]?.resource?.attributes?.find(
          (attribute) => attribute?.key === "service.name",
        )?.value?.stringValue;
        state.traces.lastServiceName = serviceName ?? null;
        state.traces.parsedPayloads += 1;
      } catch {
        state.traces.failedRequests += 1;
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }
    }

    state.traces.successRequests += 1;
    sendJson(res, 200, { accepted: true });
    return;
  }

  sendJson(res, 404, { error: "Not Found", route });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
