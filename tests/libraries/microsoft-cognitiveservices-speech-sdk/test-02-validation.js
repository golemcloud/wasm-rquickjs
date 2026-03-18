import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { MOCK_HOST_HTTP, MOCK_HOST_WS, REGION, SUBSCRIPTION_KEY } from "./helpers.js";

export const run = () => {
  assert.throws(() => sdk.SpeechConfig.fromSubscription("", REGION), /throwIfNullOrWhitespace/);
  assert.throws(() => sdk.SpeechConfig.fromSubscription(SUBSCRIPTION_KEY, ""), /throwIfNullOrWhitespace/);
  assert.throws(() => sdk.SpeechConfig.fromAuthorizationToken("token", ""), /throwIfNullOrWhitespace/);

  const authConfig = sdk.SpeechConfig.fromAuthorizationToken("", REGION);
  assert.strictEqual(authConfig.authorizationToken, "");

  const endpointConfig = sdk.SpeechConfig.fromEndpoint(
    new URL("http://localhost:18080/custom/speech?language=en-US"),
    SUBSCRIPTION_KEY,
  );
  assert.ok(endpointConfig);

  const hostHttpConfig = sdk.SpeechConfig.fromHost(MOCK_HOST_HTTP, SUBSCRIPTION_KEY);
  const hostWsConfig = sdk.SpeechConfig.fromHost(MOCK_HOST_WS, SUBSCRIPTION_KEY);

  hostHttpConfig.authorizationToken = "test-token";
  assert.strictEqual(hostHttpConfig.authorizationToken, "test-token");
  assert.ok(hostWsConfig);

  endpointConfig.close();
  authConfig.close();
  hostHttpConfig.close();
  hostWsConfig.close();

  return "PASS: SpeechConfig validation and endpoint/host constructors behave as expected";
};
