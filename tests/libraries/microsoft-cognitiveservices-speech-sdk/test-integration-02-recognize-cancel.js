import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
  createPushAudioConfig,
  getMockState,
  MOCK_HOST_WS,
  resetMockState,
  SUBSCRIPTION_KEY,
  withTimeout,
} from "./helpers.js";

export const run = async () => {
  await resetMockState();

  const config = sdk.SpeechConfig.fromHost(MOCK_HOST_WS, SUBSCRIPTION_KEY);
  config.speechRecognitionLanguage = "en-US";

  const { pushStream, audioConfig } = createPushAudioConfig();
  const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

  const result = await withTimeout("recognizeOnceAsync", (resolve, reject) => {
    recognizer.recognizeOnceAsync(resolve, (error) => reject(new Error(error)));
    pushStream.close();
  });

  assert.strictEqual(result.reason, sdk.ResultReason.Canceled);

  const state = await getMockState();
  assert.ok(
    state.upgradeRequests.some((request) =>
      request.url.startsWith("/speech/recognition/interactive/cognitiveservices/v1"),
    ),
    "expected recognizeOnceAsync() to attempt a websocket upgrade",
  );

  recognizer.close();
  // AudioConfig.close() currently crashes for custom stream sources in this SDK version.
  config.close();

  return "PASS: recognizeOnceAsync uses websocket path and surfaces cancellation from mock server";
};
