import assert from 'assert';
import _ from 'lodash';

export const run = () => {
  const users = [
    { id: 1, team: 'a', score: 10 },
    { id: 2, team: 'b', score: 25 },
    { id: 3, team: 'a', score: 15 },
    { id: 4, team: 'b', score: 20 },
  ];

  const grouped = _.groupBy(users, 'team');
  assert.deepStrictEqual(Object.keys(grouped).sort(), ['a', 'b']);
  assert.strictEqual(grouped.a.length, 2);
  assert.strictEqual(grouped.b.length, 2);

  const topByTeam = _.mapValues(grouped, (items) => _.maxBy(items, 'score').id);
  assert.deepStrictEqual(topByTeam, { a: 3, b: 2 });

  const orderedIds = _.orderBy(users, ['score', 'id'], ['desc', 'asc']).map((u) => u.id);
  assert.deepStrictEqual(orderedIds, [2, 4, 3, 1]);

  return 'PASS: collection groupBy/mapValues/orderBy works';
};
