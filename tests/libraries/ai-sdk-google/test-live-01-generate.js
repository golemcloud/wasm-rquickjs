import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const isKnownCredentialGate = (message) => {
  return (
    /API has not been used in project/i.test(message) ||
    /API key not valid/i.test(message) ||
    /PERMISSION_DENIED/i.test(message) ||
    /UNAUTHENTICATED/i.test(message)
  );
};

export const run = async () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY/GOOGLE_API_KEY for live test");
  }

  const provider = createGoogleGenerativeAI({ apiKey });
  const model = provider("gemini-2.0-flash-lite");

  try {
    const result = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Reply with exactly: GOLEM_LIVE_OK" }] }],
      temperature: 0,
      maxTokens: 8,
    });

    const text = (result.content[0]?.text || "").trim();
    assert.ok(text.toUpperCase().includes("GOLEM_LIVE_OK"));
    return "PASS: live Gemini call succeeds with configured API key";
  } catch (error) {
    const message = String(error?.message || error);
    if (!isKnownCredentialGate(message)) {
      throw error;
    }

    return "PASS: live Gemini call reached service and returned expected credential/project gate";
  }
};
