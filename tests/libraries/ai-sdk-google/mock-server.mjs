import http from "node:http";

const PORT = 18080;

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
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

const extractPromptText = (requestBody) => {
  const contents = Array.isArray(requestBody?.contents) ? requestBody.contents : [];
  for (const content of contents) {
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === "string") {
        return part.text;
      }
    }
  }
  return "";
};

const server = http.createServer(async (req, res) => {
  const path = req.url?.split("?")[0] ?? "/";

  if (req.method === "GET" && path === "/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (req.method === "POST" && path === "/v1beta/models/gemini-2.0-flash:generateContent") {
    const rawBody = await readBody(req);
    const requestBody = rawBody.length > 0 ? JSON.parse(rawBody) : {};
    const promptText = extractPromptText(requestBody);

    if (promptText === "TRIGGER_HTTP_ERROR") {
      return sendJson(res, 401, {
        error: {
          code: 401,
          message: "invalid x-goog-api-key",
          status: "UNAUTHENTICATED",
        },
      });
    }

    if (promptText === "CHECK_HEADERS") {
      const hasApiKey = req.headers["x-goog-api-key"] === "test-key";
      const hasExtraHeader = req.headers["x-extra-header"] === "present";
      if (!hasApiKey || !hasExtraHeader) {
        return sendJson(res, 400, {
          error: {
            code: 400,
            message: "missing required google headers",
            status: "INVALID_ARGUMENT",
          },
        });
      }

      return sendJson(res, 200, {
        candidates: [
          {
            content: {
              role: "model",
              parts: [{ text: "HEADERS_OK" }],
            },
            finishReason: "STOP",
            index: 0,
            safetyRatings: [],
          },
        ],
        usageMetadata: {
          promptTokenCount: 2,
          candidatesTokenCount: 1,
          totalTokenCount: 3,
        },
      });
    }

    return sendJson(res, 200, {
      candidates: [
        {
          content: {
            role: "model",
            parts: [{ text: `HTTP_MOCK:${promptText}` }],
          },
          finishReason: "STOP",
          index: 0,
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: 3,
        candidatesTokenCount: 1,
        totalTokenCount: 4,
      },
    });
  }

  if (req.method === "POST" && path === "/v1beta/models/gemini-embedding-001:batchEmbedContents") {
    const rawBody = await readBody(req);
    const requestBody = rawBody.length > 0 ? JSON.parse(rawBody) : {};
    const count = Array.isArray(requestBody?.requests) ? requestBody.requests.length : 0;
    const embeddings = Array.from({ length: count }, (_, i) => ({ values: [i + 0.1, i + 0.2, i + 0.3] }));
    return sendJson(res, 200, { embeddings });
  }

  return sendJson(res, 404, { error: "Not Found", path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
