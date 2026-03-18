import assert from 'assert';
import { Liquid } from 'liquidjs';

export const run = async () => {
  const engine = new Liquid();

  engine.registerFilter('double', (value) => Number(value) * 2);
  engine.plugin(function installPlugin() {
    this.registerFilter('suffix', (value, suffix) => `${value}${suffix}`);
  });

  const output = await engine.parseAndRender(
    '{{ 7 | double }} {{ "liquid" | suffix: "-js" }}',
    {}
  );

  assert.strictEqual(output, '14 liquid-js');
  return 'PASS: registerFilter and plugin-based extension APIs work';
};
