try {
  require('./esm.mjs');
  exports.outcome = 'no-error';
} catch (error) {
  exports.outcome = error && (error.code || error.name);
}
