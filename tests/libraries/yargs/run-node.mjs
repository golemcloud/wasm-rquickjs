const testFile = process.argv[2];
if (!testFile) {
  console.error('Usage: node run-node.mjs ./test-01-basic.js');
  process.exit(1);
}
const mod = await import(testFile);
try {
  const result = mod.run();
  console.log(result);
  if (!result.startsWith('PASS')) process.exit(1);
} catch (e) {
  console.error('FAIL:', e.message || e);
  process.exit(1);
}
