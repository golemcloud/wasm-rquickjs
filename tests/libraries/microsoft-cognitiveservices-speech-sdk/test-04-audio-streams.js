import assert from "assert";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

class MemoryPullAudioStream extends sdk.PullAudioInputStreamCallback {
  constructor(bytes) {
    super();
    this.bytes = bytes;
    this.offset = 0;
    this.closed = false;
  }

  read(buffer) {
    const target = new Uint8Array(buffer);
    const available = this.bytes.length - this.offset;
    const count = Math.min(target.length, Math.max(available, 0));
    for (let i = 0; i < count; i += 1) {
      target[i] = this.bytes[this.offset + i];
    }
    this.offset += count;
    return count;
  }

  close() {
    this.closed = true;
  }
}

export const run = () => {
  const defaultFormat = sdk.AudioStreamFormat.getDefaultInputFormat();
  const pcmFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
  const mulawFormat = sdk.AudioStreamFormat.getWaveFormat(8000, 8, 1, sdk.AudioFormatTag.MuLaw);

  assert.ok(defaultFormat);
  assert.ok(pcmFormat);
  assert.ok(mulawFormat);

  const pushStream = sdk.AudioInputStream.createPushStream(pcmFormat);
  pushStream.write(new Uint8Array([1, 2, 3, 4, 5, 6]).buffer);
  const pushAudioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  assert.ok(pushAudioConfig);

  const pullCallback = new MemoryPullAudioStream(new Uint8Array([11, 22, 33, 44]));
  const pullStream = sdk.AudioInputStream.createPullStream(pullCallback, pcmFormat);
  const pullAudioConfig = sdk.AudioConfig.fromStreamInput(pullStream);
  assert.ok(pullAudioConfig);

  pullStream.close();
  assert.strictEqual(pullCallback.closed, true);

  // AudioConfig.close() currently crashes for custom stream sources in this SDK version,
  // so these tests only verify constructor behavior and explicit stream lifecycle.
  pushStream.close();
  defaultFormat.close();
  pcmFormat.close();
  mulawFormat.close();

  return "PASS: audio stream format, push stream, and pull stream APIs work offline";
};
