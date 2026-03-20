import http from "http";

export const run = async () => {
  // Minimal reproduction of the AWS SDK's NodeHttpHandler pattern:
  // 1. Create a Promise
  // 2. Inside, call http.request() with a response callback
  // 3. Call req.end() (fire-and-forget)
  // 4. The Promise resolves when 'response' event fires
  const result = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: "DELETE",
        hostname: "127.0.0.1",
        port: 9100,
        path: "/integration-test-bucket-repro",
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, body });
        });
      }
    );

    req.on("error", (err) => {
      // Don't reject on this — bucket might not exist
      resolve({ status: 0, error: err.message });
    });

    req.end();
  });

  return `PASS: HTTP request completed with status=${result.status}`;
};
