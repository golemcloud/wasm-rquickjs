import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = () => {
  const provider = createGoogleGenerativeAI({ apiKey: "test-api-key" });

  const googleSearch = provider.tools.googleSearch({});
  const urlContext = provider.tools.urlContext({});
  const googleMaps = provider.tools.googleMaps({});
  const enterpriseWebSearch = provider.tools.enterpriseWebSearch({});
  const fileSearch = provider.tools.fileSearch({ fileSearchStoreNames: ["store-a"], topK: 2 });
  const codeExecution = provider.tools.codeExecution({});
  const vertexRagStore = provider.tools.vertexRagStore({
    ragCorpus: "projects/project-1/locations/global/ragCorpora/rag-1",
    topK: 4,
  });

  const tools = [
    [googleSearch, "google.google_search"],
    [urlContext, "google.url_context"],
    [googleMaps, "google.google_maps"],
    [enterpriseWebSearch, "google.enterprise_web_search"],
    [fileSearch, "google.file_search"],
    [codeExecution, "google.code_execution"],
    [vertexRagStore, "google.vertex_rag_store"],
  ];

  for (const [tool, expectedId] of tools) {
    assert.strictEqual(tool.type, "provider");
    assert.strictEqual(tool.id, expectedId);
    assert.ok("args" in tool);
  }

  assert.deepStrictEqual(fileSearch.args.fileSearchStoreNames, ["store-a"]);
  assert.strictEqual(fileSearch.args.topK, 2);
  assert.strictEqual(vertexRagStore.args.topK, 4);

  return "PASS: provider-defined Google tools are constructed with expected IDs and args";
};
