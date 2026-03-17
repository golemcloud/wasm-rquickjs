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

const getPromptText = (requestBody) => {
  const messages = Array.isArray(requestBody?.messages) ? requestBody.messages : [];
  for (const msg of messages) {
    if (typeof msg?.content === "string") {
      return msg.content;
    }
    if (Array.isArray(msg?.content)) {
      for (const part of msg.content) {
        if (part?.type === "text" && typeof part?.text === "string") {
          return part.text;
        }
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

  if (req.method === "POST" && path === "/v1/chat/completions") {
    const rawBody = await readBody(req);
    const requestBody = rawBody.length > 0 ? JSON.parse(rawBody) : {};
    const promptText = getPromptText(requestBody);

    if (promptText === "TRIGGER_HTTP_ERROR") {
      return sendJson(res, 401, {
        object: "error",
        message: "invalid api key",
        type: "invalid_request_error",
        param: null,
        code: null,
      });
    }

    if (promptText === "CHECK_HEADERS") {
      const hasAuth = req.headers["authorization"] === "Bearer test-key";
      const hasExtra = req.headers["x-extra-header"] === "present";
      if (!hasAuth || !hasExtra) {
        return sendJson(res, 400, {
          object: "error",
          message: "missing required headers",
          type: "invalid_request_error",
          param: null,
          code: null,
        });
      }

      return sendJson(res, 200, {
        id: "chatcmpl-headers",
        object: "chat.completion",
        created: 1730000001,
        model: requestBody?.model ?? "mistral-small-latest",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: "HEADERS_OK",
            },
          },
        ],
        usage: {
          prompt_tokens: 2,
          completion_tokens: 1,
          total_tokens: 3,
        },
      });
    }

    return sendJson(res, 200, {
      id: "chatcmpl-generate",
      object: "chat.completion",
      created: 1730000000,
      model: requestBody?.model ?? "mistral-small-latest",
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: {
            role: "assistant",
            content: `HTTP_MOCK:${promptText}`,
          },
        },
      ],
      usage: {
        prompt_tokens: 4,
        completion_tokens: 1,
        total_tokens: 5,
      },
    });
  }

  if (req.method === "POST" && path === "/v1/embeddings") {
    return sendJson(res, 200, {
      id: "embd-mock",
      object: "list",
      model: "mistral-embed",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: [0.5, 0.25, 0.125],
        },
      ],
      usage: {
        prompt_tokens: 3,
        total_tokens: 3,
      },
    });
  }

  return sendJson(res, 404, { error: "Not Found", path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
