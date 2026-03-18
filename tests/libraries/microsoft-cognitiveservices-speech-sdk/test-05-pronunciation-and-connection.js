import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { createPushAudioConfig, REGION, SUBSCRIPTION_KEY } from "./helpers.js";

export const run = () => {
  sdk.Recognizer.enableTelemetry(false);

  const pronunciation = new sdk.PronunciationAssessmentConfig(
    "hello world",
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Word,
    true,
  );
  pronunciation.phonemeAlphabet = "IPA";
  pronunciation.nbestPhonemeCount = 5;
  pronunciation.enableProsodyAssessment = true;

  const pronunciationJson = JSON.parse(pronunciation.toJSON());
  assert.strictEqual(pronunciationJson.referenceText, "hello world");
  assert.strictEqual(pronunciationJson.gradingSystem, "HundredMark");
  assert.strictEqual(pronunciationJson.granularity, "Word");
  assert.strictEqual(pronunciationJson.phonemeAlphabet, "IPA");
  assert.strictEqual(pronunciationJson.nbestPhonemeCount, 5);
  assert.strictEqual(pronunciationJson.enableProsodyAssessment, true);

  const config = sdk.SpeechConfig.fromSubscription(SUBSCRIPTION_KEY, REGION);
  const { pushStream, audioConfig } = createPushAudioConfig();
  const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

  pronunciation.applyTo(recognizer);

  const connection = sdk.Connection.fromRecognizer(recognizer);
  connection.connected = () => {};
  connection.disconnected = () => {};
  connection.messageReceived = () => {};
  connection.messageSent = () => {};
  connection.setMessageProperty("speech.context", "test-prop", JSON.stringify({ enabled: true }));
  connection.closeConnection();
  connection.close();

  recognizer.close();
  // AudioConfig.close() currently crashes for custom stream sources in this SDK version.
  pushStream.close();
  config.close();

  return "PASS: pronunciation configuration and connection management APIs work offline";
};
