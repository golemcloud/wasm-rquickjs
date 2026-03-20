import http from "node:http";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export const SUBSCRIPTION_KEY = "0123456789abcdef0123456789abcdef";
export const REGION = "eastus";
export const MOCK_HOST_HTTP = new URL("http://localhost:18080");
export const MOCK_HOST_WS = new URL("ws://localhost:18080");

export const createPushAudioConfig = () => {
  const pushStream = sdk.AudioInputStream.createPushStream(
    sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1),
  );
  return {
    pushStream,
    audioConfig: sdk.AudioConfig.fromStreamInput(pushStream),
  };
};

export const getJson = (path) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 18080,
        method: "GET",
        path,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`GET ${path} failed with status ${res.statusCode}`));
            return;
          }
          resolve(body ? JSON.parse(body) : {});
        });
      },
    );
    req.on("error", reject);
    req.end();
  });

export const postJson = (path, payload = {}) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 18080,
        method: "POST",
        path,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`POST ${path} failed with status ${res.statusCode}`));
            return;
          }
          resolve(data ? JSON.parse(data) : {});
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

export const resetMockState = async () => {
  await postJson("/reset");
};

export const getMockState = async () => getJson("/stats");

export const withTimeout = (label, executor, timeoutMs = 10000) =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    executor(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      },
    );
  });
