const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
if (!webhookSecret.startsWith('whsec_') || webhookSecret.length < 20) {
  throw new Error('CreatorOps webhook preflight: Stripe signing secret missing');
}
await import('./preflight.mjs');
console.log('CreatorOps webhook preflight passed');