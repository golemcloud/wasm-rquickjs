# LangGraph.js Compatibility Test Results

**Package:** `@langchain/langgraph`
**Version:** `1.2.1`
**Tested on:** 2026-03-09

## Test Results

### test-01-state-annotations.js — state annotations, reducers, and sequential graph composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-routing-send.js — conditional routing and `Send` fan-out/fan-in behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-messages.js — `messagesStateReducer`, message removal, and `MessagesAnnotation` graph flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-memory-checkpoint.js — `MemorySaver` thread persistence, snapshots, history, and deletion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors-and-command.js — channel error types, `Command` routing, and recursion-limit enforcement
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully tested in this offline run:

- **LLM-backed agent execution** — requires model provider credentials (for example OpenAI/Anthropic) and live API access.
- **RemoteGraph / hosted LangGraph platform integrations** — require external network services.
- **Persistent checkpointers backed by external databases** (Postgres/SQLite service deployments, Redis, MongoDB) — require running external data services.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in the tested offline API surface
- Behavioral differences: none observed
- Blockers: none for the tested offline graph/state/checkpoint APIs
