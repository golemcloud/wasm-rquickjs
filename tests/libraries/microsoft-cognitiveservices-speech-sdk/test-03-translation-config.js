import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { REGION, SUBSCRIPTION_KEY } from "./helpers.js";

export const run = () => {
  const translationConfig = sdk.SpeechTranslationConfig.fromSubscription(
    SUBSCRIPTION_KEY,
    REGION,
  );

  translationConfig.speechRecognitionLanguage = "en-US";
  translationConfig.addTargetLanguage("de");
  translationConfig.addTargetLanguage("es");
  translationConfig.voiceName = "de-DE-ConradNeural";

  assert.deepStrictEqual(translationConfig.targetLanguages, ["de", "es"]);
  assert.strictEqual(translationConfig.voiceName, "de-DE-ConradNeural");

  const sourceA = sdk.SourceLanguageConfig.fromLanguage("en-US");
  const sourceB = sdk.SourceLanguageConfig.fromLanguage("fr-FR", "custom-endpoint-fr");

  assert.strictEqual(sourceA.language, "en-US");
  assert.strictEqual(sourceB.endpointId, "custom-endpoint-fr");

  const autoDetectFromLanguages = sdk.AutoDetectSourceLanguageConfig.fromLanguages([
    "en-US",
    "fr-FR",
  ]);
  autoDetectFromLanguages.mode = sdk.LanguageIdMode.Continuous;

  const autoDetectFromConfigs = sdk.AutoDetectSourceLanguageConfig.fromSourceLanguageConfigs([
    sourceA,
    sourceB,
  ]);

  assert.ok(autoDetectFromLanguages.properties);
  assert.ok(autoDetectFromConfigs.properties);

  translationConfig.close();

  return "PASS: translation and source-language configuration APIs work offline";
};
