import { Counter } from 'test:res/host';

export async function run() {
  // Exercise an imported host *resource*: constructor, instance methods, and a static method.
  const c = new Counter(10);
  c.increment(5);
  const value = c.get();          // 15
  const zero = Counter.staticZero(); // 0
  return value + zero;            // 15
}
