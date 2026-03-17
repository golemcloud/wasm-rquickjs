import assert from 'assert';
import { ChromaClient, ChromaValueError, processCreateCollectionConfig, processUpdateCollectionConfig } from 'chromadb';

export const run = async () => {
  await assert.rejects(
    () =>
      processCreateCollectionConfig({
        configuration: {
          hnsw: { space: 'cosine' },
          spann: { space: 'l2' },
        },
      }),
    (error) =>
      error instanceof ChromaValueError &&
      error.message.includes('Cannot specify both HNSW and SPANN configurations'),
  );

  const explicitNoEf = await processCreateCollectionConfig({
    configuration: {
      hnsw: { space: 'cosine' },
    },
    embeddingFunction: null,
  });

  assert.deepStrictEqual(explicitNoEf.hnsw, { space: 'cosine' });
  assert.strictEqual(explicitNoEf.embedding_function, undefined);

  await assert.rejects(
    () =>
      processUpdateCollectionConfig({
        collectionName: 'cfg-test',
        currentConfiguration: {},
        currentEmbeddingFunction: undefined,
        newConfiguration: {
          hnsw: 'not-an-object',
        },
        client: new ChromaClient(),
      }),
    (error) =>
      error instanceof ChromaValueError &&
      error.message.includes('Invalid HNSW config provided in UpdateCollectionConfiguration'),
  );

  return 'PASS: collection configuration helpers validate HNSW/SPANN options correctly';
};
