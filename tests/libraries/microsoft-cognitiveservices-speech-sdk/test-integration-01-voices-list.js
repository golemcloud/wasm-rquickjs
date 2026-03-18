import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
  getMockState,
  MOCK_HOST_HTTP,
  REGION,
  resetMockState,
  SUBSCRIPTION_KEY,
} from "./helpers.js";

export const run = async () => {
  await resetMockState();

  const config = sdk.SpeechConfig.fromHost(MOCK_HOST_HTTP, SUBSCRIPTION_KEY);
  config.speechRecognitionLanguage = REGION;

  const synthesizer = new sdk.SpeechSynthesizer(config, null);
  const voices = await synthesizer.getVoicesAsync("en-US");

  assert.strictEqual(voices.reason, sdk.ResultReason.VoicesListRetrieved);
  assert.ok(Array.isArray(voices.voices));
  assert.strictEqual(voices.voices.length, 1);
  assert.strictEqual(voices.voices[0].shortName, "en-US-TestNeural");
  assert.strictEqual(voices.voices[0].locale, "en-US");

  const state = await getMockState();
  assert.ok(
    state.httpRequests.some((request) =>
      request.url.startsWith("/cognitiveservices/voices/list"),
    ),
    "expected getVoicesAsync() to call /cognitiveservices/voices/list",
  );

  synthesizer.close();
  config.close();

  return "PASS: getVoicesAsync hits HTTP mock endpoint and parses voice metadata";
};
