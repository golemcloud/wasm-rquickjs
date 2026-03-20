import assert from 'assert';
import {
  ChromaClient,
  getEmbeddingFunction,
  knownEmbeddingFunctions,
  registerEmbeddingFunction,
  serializeEmbeddingFunction,
} from 'chromadb';

const DUMMY_NAME = 'amp-dummy-embedding-function';

class DummyEmbeddingFunction {
  constructor(config = {}) {
    this.name = DUMMY_NAME;
    this.config = config;
  }

  static buildFromConfig(config) {
    return new DummyEmbeddingFunction(config);
  }

  getConfig() {
    return this.config;
  }

  validateConfig(config) {
    if (typeof config.dimension !== 'number') {
      throw new Error('dimension must be a number');
    }
  }

  async generate(texts) {
    return texts.map(() => [1, 0, 0]);
  }
}

export const run = async () => {
  registerEmbeddingFunction(DUMMY_NAME, DummyEmbeddingFunction);
  assert.strictEqual(knownEmbeddingFunctions.get(DUMMY_NAME), DummyEmbeddingFunction);

  const resolved = await getEmbeddingFunction({
    client: new ChromaClient(),
    efConfig: {
      type: 'known',
      name: DUMMY_NAME,
      config: { dimension: 3 },
    },
  });

  assert.ok(resolved instanceof DummyEmbeddingFunction);
  assert.deepStrictEqual(resolved.getConfig(), { dimension: 3 });

  const serialized = serializeEmbeddingFunction({ embeddingFunction: resolved });
  assert.deepStrictEqual(serialized, {
    name: DUMMY_NAME,
    type: 'known',
    config: { dimension: 3 },
  });

  return 'PASS: embedding function registry, resolver, and serializer work for custom embeddings';
};
