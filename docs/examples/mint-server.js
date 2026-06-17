#!/usr/bin/env node
//
// Stand-in "customer backend" for the HTML and React tutorial examples.
//
// In real life, YOUR backend mints this token after checking YOUR OWN login
// session - see docs/embed-tutorial.md. This script has no auth at all and
// signs whatever `sub`/`role` the caller asks for, so it only exists to let
// a plain HTML page or a backend-less React app get a token without you
// having to stand up a real server. Do not deploy this anywhere.
//
// Usage: node mint-server.js
// Then:  curl http://localhost:4001/mint-token

const http = require('http');
const crypto = require('crypto');

const TENANT_SLUG = process.env.VIDYA_EMBED_ISSUER || 'xyz_learn';
// Test-tenant secret from vidya_ai_backend's embed-integration-dev-testing.md.
// Local testing only - re-provision with a fresh secret before using this
// pattern for a real customer.
const EMBED_SECRET = process.env.VIDYA_EMBED_SECRET || 'KDlKn4iinax__79-R03gRtYJsOZtfOFxiiiUwD2aM3g';
const PORT = process.env.MINT_SERVER_PORT || 4001;

function base64url(buf) {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function mintToken({ sub, name, role }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub,
    name,
    role,
    iss: TENANT_SLUG,
    aud: 'vidyaai-embed',
    iat: now,
    exp: now + 5 * 60,
  };
  const data = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
  const signature = base64url(crypto.createHmac('sha256', EMBED_SECRET).update(data).digest());
  return `${data}.${signature}`;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/mint-token') {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  const role = url.searchParams.get('role') === 'professor' ? 'professor' : 'student';
  // Each caller should pass its own `sub` (e.g. ?sub=html-demo-user) - sub is
  // what isolates one embed user's account/quota from another's.
  const sub = url.searchParams.get('sub') || 'demo-user';
  const token = mintToken({ sub, name: 'Demo User', role });

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify({ token }));
});

server.listen(PORT, () => {
  console.log(`Mint server running at http://localhost:${PORT}/mint-token`);
  console.log(`Tenant: ${TENANT_SLUG}`);
});
