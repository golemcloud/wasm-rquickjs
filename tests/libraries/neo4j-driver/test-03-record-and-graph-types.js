import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = () => {
  const node = new neo4j.types.Node(
    neo4j.int(1),
    ['Person'],
    { name: 'Alice' },
    'node-1'
  );

  assert.ok(neo4j.isNode(node));
  assert.strictEqual(node.labels[0], 'Person');
  assert.strictEqual(node.properties.name, 'Alice');

  const record = new neo4j.Record(['node', 'count'], [node, neo4j.int(2)]);
  assert.ok(record.has('node'));
  assert.ok(neo4j.isInt(record.get('count')));
  assert.strictEqual(record.toObject().node.properties.name, 'Alice');

  return 'PASS: graph types and Record objects are constructible offline';
};
