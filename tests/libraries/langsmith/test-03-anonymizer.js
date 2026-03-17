import assert from "assert";
import { createAnonymizer } from "langsmith/anonymizer";

export const run = () => {
  const anonymize = createAnonymizer([
    {
      pattern: /sk-[a-z0-9]+/gi,
      replace: "[REDACTED_API_KEY]",
    },
    {
      pattern: /alice@example\.com/gi,
      replace: "[REDACTED_EMAIL]",
    },
  ]);

  const input = {
    prompt: "hello",
    metadata: {
      owner: "alice@example.com",
      token: "sk-abc123xyz",
    },
  };

  const output = anonymize(input);
  assert.strictEqual(output.metadata.owner, "[REDACTED_EMAIL]");
  assert.strictEqual(output.metadata.token, "[REDACTED_API_KEY]");
  assert.strictEqual(output.prompt, "hello");

  return "PASS: createAnonymizer redacts sensitive strings";
};
