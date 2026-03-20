import http from "http";

// Same as test-repro-minimal but with an await before the Promise constructor
async function handle(options) {
  // This single await is the difference!
  const config = await Promise.resolve({ httpAgent: undefined });

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: options.method,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body });
        });
      }
    );

    req.on("error", (err) => {
      resolve({ statusCode: 0, error: err.message });
    });

    req.end();
  });
}

export const run = async () => {
  const result = await handle({
    method: "DELETE",
    hostname: "127.0.0.1",
    port: 9100,
    path: "/integration-test-bucket-repro",
  });

  return `PASS: status=${result.statusCode}`;
};
