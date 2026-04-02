/**
 * Coinbase OnRamp Session Token generation.
 *
 * Required environment variables (server-side only, no VITE_ prefix):
 *   CDP_KEY_NAME    — from portal.cdp.coinbase.com → API Keys → "name" field
 *                     e.g. "organizations/abc123/apiKeys/def456"
 *   CDP_PRIVATE_KEY — the EC private key PEM from the same portal
 *                     (paste as-is, \n sequences are handled automatically)
 *
 * The session token is passed to the Coinbase Pay widget as &sessionToken=...
 * so Coinbase can verify the request comes from YOUR app (Secure Initialization).
 */

import { createSign, createPrivateKey, randomBytes } from 'crypto';

const CDP_API_HOST = 'api.developer.coinbase.com';
const SESSION_TOKEN_PATH = '/onramp/v1/token';

// ─── JWT helpers ────────────────────────────────────────────────────────────

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert DER-encoded ECDSA signature to raw R || S (64 bytes) for ES256.
 * OpenSSL/Node produces DER; JWT spec requires raw R+S.
 */
function derSigToRaw(der: Buffer): Buffer {
  let i = 2; // skip SEQUENCE tag + length

  // r
  i++; // skip INTEGER tag
  let rLen = der[i++];
  let r = der.slice(i, i + rLen);
  i += rLen;

  // s
  i++; // skip INTEGER tag
  let sLen = der[i++];
  let s = der.slice(i, i + sLen);

  // DER pads with 0x00 if the high bit is set — strip it
  if (r[0] === 0x00) r = r.slice(1);
  if (s[0] === 0x00) s = s.slice(1);

  // Pad to exactly 32 bytes each
  const rPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length)), r]);
  const sPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length)), s]);

  return Buffer.concat([rPad, sPad]);
}

/**
 * Build and sign a CDP API JWT (ES256).
 * The `uri` claim must be exactly: `<METHOD> <host><path>` (no https://).
 */
function buildCDPJWT(keyName: string, privateKeyPem: string, method: string, path: string): string {
  const now = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('hex');

  const header = { alg: 'ES256', kid: keyName, nonce };
  const payload = {
    sub: keyName,
    iss: 'cdp',
    nbf: now,
    exp: now + 120,
    uri: `${method} ${CDP_API_HOST}${path}`,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const privKey = createPrivateKey(privateKeyPem);
  const sign = createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const derSig = sign.sign(privKey);
  const rawSig = derSigToRaw(derSig);
  const sigB64 = base64url(rawSig);

  return `${signingInput}.${sigB64}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SessionTokenRequest {
  address: string;
  assets?: string[];
  blockchains?: string[];
}

export interface SessionTokenResponse {
  token: string;
}

/**
 * Generate a Coinbase OnRamp session token for a given wallet address.
 * Throws if CDP credentials are not configured or if the API returns an error.
 */
export async function generateSessionToken(req: SessionTokenRequest): Promise<SessionTokenResponse> {
  const keyName = process.env.CDP_KEY_NAME;
  const rawPrivKey = process.env.CDP_PRIVATE_KEY;

  if (!keyName || !rawPrivKey) {
    throw new Error(
      'CDP_KEY_NAME and CDP_PRIVATE_KEY must be set in the environment. ' +
      'Get them from portal.cdp.coinbase.com → API Keys.',
    );
  }

  // Support both literal newlines and \n escape sequences (common in .env files)
  const privateKeyPem = rawPrivKey.replace(/\\n/g, '\n');

  const jwt = buildCDPJWT(keyName, privateKeyPem, 'POST', SESSION_TOKEN_PATH);

  const body = JSON.stringify({
    destination_wallets: [
      {
        address: req.address,
        blockchains: req.blockchains ?? ['base'],
        assets: req.assets ?? ['USDC'],
      },
    ],
  });

  const response = await fetch(`https://${CDP_API_HOST}${SESSION_TOKEN_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Coinbase session token API error ${response.status}: ${text}`);
  }

  const json = (await response.json()) as { data?: { token?: string }; token?: string };

  // API can return { data: { token } } or { token } depending on version
  const token = json?.data?.token ?? json?.token;
  if (!token) {
    throw new Error('Coinbase API did not return a session token');
  }

  return { token };
}

/** Returns true if CDP credentials are present in the environment. */
export function isCDPConfigured(): boolean {
  return !!(process.env.CDP_KEY_NAME && process.env.CDP_PRIVATE_KEY);
}
