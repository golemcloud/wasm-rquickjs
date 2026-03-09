import assert from "assert";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnableLambda,
  RunnableParallel,
  RunnableSequence,
} from "@langchain/core/runnables";

export const run = async () => {
  const prompt = PromptTemplate.fromTemplate("Hello, {name}!");
  const rendered = await prompt.format({ name: "LangChain" });
  assert.strictEqual(rendered, "Hello, LangChain!");

  const sequence = RunnableSequence.from([
    RunnableLambda.from((input) => input.trim()),
    RunnableLambda.from((input) => input.toUpperCase()),
    RunnableLambda.from((input) => `${input}!`),
  ]);

  const sequenceResult = await sequence.invoke("  runnable  ");
  assert.strictEqual(sequenceResult, "RUNNABLE!");

  const parallel = RunnableParallel.from({
    upper: RunnableLambda.from((input) => input.toUpperCase()),
    lower: RunnableLambda.from((input) => input.toLowerCase()),
  });

  const parallelResult = await parallel.invoke("MiXeD");
  assert.deepStrictEqual(parallelResult, { upper: "MIXED", lower: "mixed" });

  return "PASS: prompt formatting and runnable composition work";
};
