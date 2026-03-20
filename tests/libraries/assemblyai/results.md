# AssemblyAI Compatibility Test Results

**Package:** `assemblyai`
**Version:** `4.28.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client initialization and service namespace availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-constructor-and-baseurl.js — constructor parameter wiring and base URL normalization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-realtime-transcriber.js — realtime transcriber URL generation and pre-connect send guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-streaming-transcriber.js — streaming transcriber URL generation and pre-connect guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-stream-writer-guards.js — writable stream helper behavior before socket connection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-upload-submit.js — `files.upload()` and `transcripts.submit()` against mock API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-transcript-reads.js — `transcripts.transcribe()` polling + read endpoints (`sentences`, `paragraphs`, `wordSearch`, `subtitles`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-lemur-and-tokens.js — `lemur.summary()` + temporary token APIs (`realtime` and `streaming`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain `ASSEMBLYAI_API_KEY`.

## Untestable Features

The following features could not be tested without a real AssemblyAI API key:

- **Live AssemblyAI API calls against `https://api.assemblyai.com`** — requires `ASSEMBLYAI_API_KEY`
- **Real transcription execution and service-side model behavior** — requires authenticated live requests
- **Real WebSocket streaming transcription sessions** — requires authenticated live realtime/streaming endpoints

To fully test these features, provide `ASSEMBLYAI_API_KEY` in `tests/libraries/.tokens.json` and add `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `ASSEMBLYAI_API_KEY` token available
- Missing APIs: none observed in tested paths
- Behavioral differences: none observed in tested paths
- Blockers: live AssemblyAI behavior remains credential-gated
