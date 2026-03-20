import assert from 'node:assert';
import { PromptTemplate } from 'llamaindex';

export const run = () => {
  const template = new PromptTemplate({
    template: 'Answer in {language}: {question}',
  });

  const partial = template.partialFormat({ language: 'English' });
  const rendered = partial.format({ question: 'What is 2+2?' });
  assert.strictEqual(rendered, 'Answer in English: What is 2+2?');

  const vars = template.vars().sort();
  assert.deepStrictEqual(vars, ['language', 'question']);

  return 'PASS: PromptTemplate formatting and partials work';
};
