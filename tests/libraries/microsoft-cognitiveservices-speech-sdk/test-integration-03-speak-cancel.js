import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
  getMockState,
  MOCK_HOST_WS,
  resetMockState,
  SUBSCRIPTION_KEY,
  withTimeout,
} from "./helpers.js";

export const run = async () => {
  await resetMockState();

  const config = sdk.SpeechConfig.fromHost(MOCK_HOST_WS, SUBSCRIPTION_KEY);
  config.speechSynthesisVoiceName = "en-US-JennyNeural";

  const synthesizer = new sdk.SpeechSynthesizer(config, null);

  const result = await withTimeout("speakTextAsync", (resolve, reject) => {
    synthesizer.speakTextAsync("hello from mock server", resolve, (error) => reject(new Error(error)));
  });

  assert.strictEqual(result.reason, sdk.ResultReason.Canceled);

  const state = await getMockState();
  assert.ok(
    state.upgradeRequests.some((request) =>
      request.url.startsWith("/tts/cognitiveservices/websocket/v1"),
    ),
    "expected speakTextAsync() to attempt a websocket upgrade",
  );

  synthesizer.close();
  config.close();

  return "PASS: speakTextAsync uses websocket synthesis path and returns canceled result on mock rejection";
};
