import http from "node:http";

const PORT = 18080;

const runs = new Map();

const readBody = async (req) => {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
};

const send = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/runs") {
    const body = await readBody(req);
    if (!body.id) {
      send(res, 400, { error: "missing id" });
      return;
    }
    runs.set(body.id, { ...body });
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/runs/")) {
    const id = url.pathname.replace("/runs/", "");
    const body = await readBody(req);
    const current = runs.get(id) ?? { id };
    runs.set(id, { ...current, ...body });
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/runs/")) {
    const id = url.pathname.replace("/runs/", "");
    const run = runs.get(id);
    if (!run) {
      send(res, 404, { error: "run not found", id });
      return;
    }
    send(res, 200, run);
    return;
  }

  if (req.method === "GET" && url.pathname === "/runs") {
    send(res, 200, Array.from(runs.values()));
    return;
  }

  if (req.method === "POST" && url.pathname === "/runs/query") {
    send(res, 200, {
      runs: Array.from(runs.values()),
      cursors: null,
    });
    return;
  }

  send(res, 404, { error: "Not Found", path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
