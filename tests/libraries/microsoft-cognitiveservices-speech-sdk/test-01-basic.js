import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { REGION, SUBSCRIPTION_KEY } from "./helpers.js";

export const run = () => {
  const config = sdk.SpeechConfig.fromSubscription(SUBSCRIPTION_KEY, REGION);

  assert.strictEqual(config.subscriptionKey, SUBSCRIPTION_KEY);
  assert.strictEqual(config.region, REGION);

  config.speechRecognitionLanguage = "fr-FR";
  assert.strictEqual(config.speechRecognitionLanguage, "fr-FR");

  config.outputFormat = sdk.OutputFormat.Detailed;
  assert.strictEqual(config.outputFormat, sdk.OutputFormat.Detailed);

  config.setProperty("custom.test.property", "custom-value");
  assert.strictEqual(config.getProperty("custom.test.property"), "custom-value");

  config.close();

  return "PASS: SpeechConfig base construction and property configuration work";
};
