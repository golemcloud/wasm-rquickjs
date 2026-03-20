import http from "node:http";

const PORT = 18080;

const state = {
  httpRequests: [],
  upgradeRequests: [],
};

const recordHttpRequest = (method, url) => {
  if (url === "/health" || url === "/stats" || url === "/reset") {
    return;
  }
  state.httpRequests.push({ method, url });
};

const server = http.createServer((req, res) => {
  const path = req.url.split("?")[0];

  if (req.method === "GET" && path === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && path === "/reset") {
    state.httpRequests = [];
    state.upgradeRequests = [];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "reset" }));
    return;
  }

  if (req.method === "GET" && path === "/stats") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(state));
    return;
  }

  recordHttpRequest(req.method, req.url);

  if (req.method === "GET" && path === "/cognitiveservices/voices/list") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify([
        {
          Name: "en-US-TestNeural",
          ShortName: "en-US-TestNeural",
          Locale: "en-US",
          Gender: "Female",
          VoiceType: "Neural",
          Status: "GA",
          SampleRateHertz: "24000",
          WordsPerMinute: "150",
        },
      ]),
    );
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found", path: req.url }));
});

server.on("upgrade", (req, socket) => {
  state.upgradeRequests.push({ method: req.method, url: req.url });
  socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
  socket.destroy();
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
