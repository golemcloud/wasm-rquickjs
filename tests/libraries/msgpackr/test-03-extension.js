import assert from 'assert';
import { addExtension, pack, unpack } from 'msgpackr';

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

addExtension({
  Class: Point,
  type: 0x52,
  write(value) {
    return [value.x, value.y];
  },
  read(data) {
    return new Point(data[0], data[1]);
  },
});

export const run = () => {
  const original = new Point(10, -4);
  const decoded = unpack(pack(original));

  assert.ok(decoded instanceof Point);
  assert.strictEqual(decoded.x, 10);
  assert.strictEqual(decoded.y, -4);

  return 'PASS: addExtension supports custom class serialization';
};
