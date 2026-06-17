const assert = require('node:assert');
const Stripe = require('stripe');

exports.run = () => {
  const stripe = new Stripe('sk_test_123', { apiVersion: '2024-06-20' });
  assert.strictEqual(typeof stripe.customers.create, 'function');
  assert.strictEqual(typeof stripe.paymentIntents.retrieve, 'function');
  const err = new Stripe.errors.StripeCardError({ message: 'declined', code: 'card_declined' });
  assert.strictEqual(err.code, 'card_declined');
  return 'PASS: Stripe SDK imports and exposes offline client surfaces from node_modules';
};
