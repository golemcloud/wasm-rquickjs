import assert from 'assert';
import protos from '@google-cloud/text-to-speech/build/protos/protos.js';

export const run = () => {
  const request = new protos.google.cloud.texttospeech.v1.SynthesizeSpeechRequest({
    input: { text: 'Hello from proto request' },
    voice: { languageCode: 'en-US', name: 'en-US-Standard-A' },
    audioConfig: {
      audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
      speakingRate: 1.0,
    },
  });

  const encoded = protos.google.cloud.texttospeech.v1.SynthesizeSpeechRequest.encode(request).finish();
  const decoded = protos.google.cloud.texttospeech.v1.SynthesizeSpeechRequest.decode(encoded);

  assert.strictEqual(decoded.input.text, 'Hello from proto request');
  assert.strictEqual(decoded.voice.languageCode, 'en-US');
  assert.strictEqual(decoded.voice.name, 'en-US-Standard-A');
  assert.strictEqual(decoded.audioConfig.audioEncoding, protos.google.cloud.texttospeech.v1.AudioEncoding.MP3);

  const AudioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding;
  const SsmlVoiceGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender;
  assert.strictEqual(AudioEncoding.LINEAR16, 1);
  assert.strictEqual(AudioEncoding.MP3, 2);
  assert.ok(SsmlVoiceGender.FEMALE > 0);

  return 'PASS: proto constructors, encode/decode, and enums work offline';
};
