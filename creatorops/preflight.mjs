import { createPrivateKey, sign as cryptoSign } from 'node:crypto';

const gatewayUrl = process.env.CREATOROPS_GATEWAY_URL || '';
const signingKeyB64 = process.env.CREATOROPS_SIGNING_KEY_B64 || '';

if (!gatewayUrl || !signingKeyB64) {
  throw new Error('CreatorOps preflight: backend configuration missing');
}

const privateKey = createPrivateKey({
  key: Buffer.from(signingKeyB64, 'base64'),
  format: 'der',
  type: 'pkcs8'
});

const ts = String(Date.now());
const method = 'GET';
const operation = 'admin-list';
const body = '';
const message = `${ts}\n${method}\n${operation}\n${body}`;
const signature = cryptoSign(null, Buffer.from(message), privateKey).toString('base64');

const response = await fetch(gatewayUrl, {
  method,
  headers: {
    'x-creatorops-ts': ts,
    'x-creatorops-operation': operation,
    'x-creatorops-signature': signature
  },
  signal: AbortSignal.timeout(12000)
});

if (!response.ok) {
  throw new Error(`CreatorOps preflight: signed backend returned ${response.status}`);
}

const result = await response.json();
if (!Array.isArray(result.applications)) {
  throw new Error('CreatorOps preflight: unexpected backend response');
}

console.log('CreatorOps preflight passed');