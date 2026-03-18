import assert from 'assert';
import protos from '@google-cloud/speech/build/protos/protos.js';

export const run = () => {
  const RecognizeRequest = protos.google.cloud.speech.v2.RecognizeRequest;
  const request = new RecognizeRequest({
    recognizer: 'projects/project-a/locations/us-central1/recognizers/_',
    config: {
      autoDecodingConfig: {},
      languageCodes: ['en-US'],
      model: 'latest_short',
    },
    content: Buffer.from([0, 1, 2, 3]),
  });

  const encoded = RecognizeRequest.encode(request).finish();
  const decoded = RecognizeRequest.decode(encoded);

  assert.strictEqual(decoded.recognizer, 'projects/project-a/locations/us-central1/recognizers/_');
  assert.strictEqual(decoded.config.languageCodes[0], 'en-US');
  assert.strictEqual(decoded.config.model, 'latest_short');

  const AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;
  assert.strictEqual(AudioEncoding.LINEAR16, 1);
  assert.strictEqual(AudioEncoding.FLAC, 2);
  assert.strictEqual(AudioEncoding.OGG_OPUS, 6);

  return 'PASS: proto constructors, encode/decode, and enums work offline';
};
