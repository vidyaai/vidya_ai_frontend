# Tutorial: Embedding Vidya AI in a Third-Party Site

A hands-on, step-by-step walkthrough for testing the Vidya AI iframe embed
against a plain HTML page, a React (Vite) app, and a Next.js app, all running
locally. For the customer-facing reference (just the snippets, no walkthrough),
see [embed-integration.md](../../vidya_ai_backend/embed-integration.md). For
internal backend test setup, see
[embed-integration-dev-testing.md](../../vidya_ai_backend/embed-integration-dev-testing.md).

Runnable example projects for every section below live in
[`docs/examples/`](./examples/).

## How it fits together

```
Third-party site (HTML / React / Next.js)
  |
  |  iframe src="http://localhost:3000/embed/chat?token=<jwt>"
  v
Vidya AI frontend (this repo, npm/yarn run dev)
  |
  |  POST /api/embed/session  { token }
  v
Vidya AI backend (vidya_ai_backend, uvicorn)
  |
  |  verifies JWT against the tenant's embed_secret,
  |  returns { firebase_token, course_id, video_id, user_type }
  v
Browser signs into Firebase with firebase_token, renders chat/assignments UI,
then posts {type: "vidya-resize", height} back to the parent page so its
iframe can resize to fit.
```

The third-party page **never** talks to the Vidya backend directly - it only
sets an iframe `src` and listens for `postMessage`. The JWT handoff token is
minted by *your* backend (never in browser JS) using a per-tenant
`embed_secret`, and is valid for at most 5 minutes.

Two modes, used identically in all three examples below:

- **`?token=<jwt>`** - authenticated mode, pre-signs the visitor into a
  tenant-scoped Vidya account.
- **`?demo=true`** - no auth, everyone shares one demo account. Good for a
  zero-setup smoke test.

## 0. Prerequisites

You need the Vidya backend and the Vidya frontend (this repo) running
locally, plus a provisioned test tenant. If you've already done this per
`embed-integration-dev-testing.md`, skip to [step 1](#1-start-the-vidya-backend-and-frontend).

```bash
# Backend: apply migrations once
cd vidya_ai_backend
vidyaai_env/bin/alembic upgrade head

# Provision a test tenant (prints a slug + embed_secret)
cd src
python -m scripts.provision_embed_client xyz_learn "XYZ Learn"
```

The examples in this tutorial hard-code the secret already provisioned per
`embed-integration-dev-testing.md`
(`slug=xyz_learn`, `embed_secret=KDlKn4iinax__79-R03gRtYJsOZtfOFxiiiUwD2aM3g`).
If you provisioned a fresh one, swap it into `docs/examples/mint-server.js`
and `docs/examples/nextjs-site/.env.local` instead.

Also confirm your backend `.env` has a generous token-age window for local
testing (production should **not** set this):

```
EMBED_MAX_TOKEN_AGE_SECONDS=3600
```

## 1. Start the Vidya backend and frontend

**Backend** (port 8000):

```bash
cd vidya_ai_backend/src
../vidyaai_env/bin/uvicorn main:app --reload --port 8000
```

**Frontend** (port 3000) - this repo:

```bash
cd vidya_ai_frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 NEXT_PUBLIC_NODE_ENV=local-test yarn dev
```

> **Gotcha:** `src/components/generic/utils.jsx` hard-overrides the API URL
> when `NEXT_PUBLIC_NODE_ENV` is `development`, `production`, or `local` -
> any of those will silently point the frontend at a remote API regardless
> of `NEXT_PUBLIC_API_BASE_URL`. Use any other value (e.g. `local-test`) to
> make `NEXT_PUBLIC_API_BASE_URL` actually take effect.

Confirm both are up:

```bash
curl http://localhost:8000/                      # {"status": "Vidya AI backend is running"}
curl http://localhost:3000/embed/chat -o /dev/null -w "%{http_code}\n"   # 200
```

## 2. Quickest smoke test: demo mode, no token

Before wiring up any third-party site, confirm the embed routes work at all:

```
http://localhost:3000/embed/chat?demo=true
http://localhost:3000/embed/assignments?demo=true
```

You should see the chat/assignments UI with **no** top nav, no menu button,
no back arrow. If this doesn't render, fix that before moving on - none of
the third-party examples below will work either.

## 3. Mint a test JWT (used by the HTML and React examples)

The HTML and React examples are pure client-side apps, so they need
something to play the role of "your backend" that mints the handoff token.
[`docs/examples/mint-server.js`](./examples/mint-server.js) is exactly that -
a zero-dependency Node script that signs a 5-minute JWT with the test
tenant's `embed_secret`. **It has no auth of its own; it exists purely so
this tutorial doesn't require you to stand up a real server. Never deploy
anything like it.**

```bash
cd vidya_ai_frontend/docs/examples
node mint-server.js
# Mint server running at http://localhost:4001/mint-token
```

Sanity check:

```bash
curl http://localhost:4001/mint-token
# {"token":"eyJ..."}
```

The Next.js example does this the *real* way instead - minting the token in
a server-side API route - so it doesn't need `mint-server.js` at all (see
[step 6](#6-nextjs-site)).

## 4. HTML site

[`docs/examples/html-site/index.html`](./examples/html-site/index.html) is a
single static file: two buttons (demo / authenticated), an iframe, and a
`postMessage` listener for auto-resize.

```bash
cd vidya_ai_frontend/docs/examples/html-site
python3 -m http.server 5500
```

Open `http://localhost:5500/`. With `mint-server.js` still running from
step 3:

1. Click **"Load demo mode"** - iframe loads `/embed/chat?demo=true` immediately.
2. Click **"Load authenticated mode"** - the page fetches a token from
   `mint-server.js`, then sets the iframe `src` to
   `/embed/chat?token=<jwt>&v=dQw4w9WgXcQ`.
3. Watch the iframe grow/shrink as content loads - that's the resize
   `postMessage` round trip working.

The whole integration is this block (trimmed from `index.html`):

```html
<iframe id="vidya-frame" style="width:100%;border:0;height:600px;"></iframe>
<script>
  const VIDYA_BASE = 'http://localhost:3000';
  const frame = document.getElementById('vidya-frame');

  window.addEventListener('message', (e) => {
    if (e.origin !== VIDYA_BASE) return;
    if (e.data?.type === 'vidya-resize') frame.style.height = e.data.height + 'px';
  });

  frame.src = `${VIDYA_BASE}/embed/chat?token=${jwtFromYourBackend}&v=dQw4w9WgXcQ`;
</script>
```

## 5. React site

[`docs/examples/react-site/`](./examples/react-site/) is a minimal Vite +
React app with a reusable `<VidyaEmbed />` component
([`src/VidyaEmbed.jsx`](./examples/react-site/src/VidyaEmbed.jsx)) that
fetches a token from `mint-server.js`, renders the iframe, and wires up the
resize listener in a `useEffect`.

```bash
# terminal A - keep mint-server.js running from step 3
cd vidya_ai_frontend/docs/examples/react-site
npm install
npm run dev
```

Open the printed Vite URL (typically `http://localhost:5173`). Same two
buttons as the HTML example, same behavior.

The reusable piece:

```jsx
function VidyaEmbed({ demo, query }) {
  const frameRef = useRef(null);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (demo) { setSrc(`${VIDYA_BASE}/embed/chat?demo=true`); return; }
    fetch(MINT_SERVER).then(r => r.json()).then(({ token }) =>
      setSrc(`${VIDYA_BASE}/embed/chat?token=${token}&${query}`)
    );
  }, [demo, query]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin === VIDYA_BASE && e.data?.type === 'vidya-resize') {
        frameRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return src ? <iframe ref={frameRef} src={src} style={{ width: '100%', border: 0 }} /> : null;
}
```

## 6. Next.js site

[`docs/examples/nextjs-site/`](./examples/nextjs-site/) shows the
**production-shaped** pattern: the handoff JWT is minted in a Next.js API
route ([`app/api/mint-token/route.js`](./examples/nextjs-site/app/api/mint-token/route.js))
using the `jsonwebtoken` package, so the `embed_secret` lives in a server-side
env var and never reaches the browser. No `mint-server.js` needed here - this
*is* "your backend."

```bash
cd vidya_ai_frontend/docs/examples/nextjs-site
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:4002`. Same two buttons; "Authenticated mode" calls
`GET /api/mint-token` (same-origin, no CORS to worry about) and uses the
returned token.

The realistic part to copy into an actual customer Next.js app:

```js
// app/api/mint-token/route.js - runs on the server, secret never reaches the browser
import jwt from 'jsonwebtoken';

export async function GET(request) {
  // In production: pull sub/name/role from YOUR authenticated session,
  // not a query param.
  const token = jwt.sign(
    { sub: 'demo-user-1', name: 'Demo User', role: 'student' },
    process.env.VIDYA_EMBED_SECRET,
    { algorithm: 'HS256', issuer: process.env.VIDYA_EMBED_ISSUER, audience: 'vidyaai-embed', expiresIn: '5m' }
  );
  return Response.json({ token });
}
```

```jsx
// app/page.js (client component)
useEffect(() => {
  fetch('/api/mint-token').then(r => r.json()).then(({ token }) =>
    setSrc(`${VIDYA_BASE}/embed/chat?token=${token}&v=dQw4w9WgXcQ`)
  );
}, []);
```

## 7. Run all three at once

All three examples (plus `mint-server.js`) sit on different ports and don't
conflict:

| Process | Port |
|---|---|
| Vidya backend | 8000 |
| Vidya frontend | 3000 |
| mint-server.js | 4001 |
| html-site (`python3 -m http.server`) | 5500 |
| react-site (`npm run dev`) | 5173 |
| nextjs-site (`npm run dev`) | 4002 |

Start them all, then open all three demo pages side by side and click
through both modes on each - this is the full matrix the dev-testing guide's
acceptance criteria asks for.

## Troubleshooting

- **"Could not load Vidya AI - Missing token"** - you navigated to
  `/embed/chat` with neither `?token=` nor `?demo=true`. Check the iframe
  `src` was actually set.
- **"Token expired" / "Token too old"** - JWTs here are minted for 5 minutes
  (the `iat` staleness check is separate from `exp` and defaults to 300s -
  see `EMBED_MAX_TOKEN_AGE_SECONDS` in the backend `.env`). Re-click the
  "Authenticated mode" button to mint a fresh one rather than reusing an old
  URL.
- **CORS error fetching `mint-token`** - only the HTML/React examples call
  `mint-server.js` directly from the browser; confirm it's running on 4001.
  The Next.js example doesn't need this at all (same-origin API route). Note
  the third-party page itself never needs CORS clearance from the Vidya
  *backend* - it only ever talks to Vidya through the iframe.
- **Iframe never resizes / stays at its initial height** - check
  `e.origin !== VIDYA_BASE` isn't silently swallowing the message because
  you're loading Vidya from a different port/host than what your listener
  checks against.
- **Mixed content blocked (HTTPS page, HTTP iframe)** - only relevant once
  you're embedding in a real HTTPS site (e.g. Google Sites) against a local
  HTTP backend. See `embed-integration-dev-testing.md` section 9 for the
  tunnel-based workaround; not an issue for the local-only examples above.
- **"Daily limit reached (3/3)"** - each embed `sub` maps to its own isolated
  Vidya account, which has the same free-tier daily video-load quota as any
  other account. The HTML, React, and Next.js examples deliberately use
  different `sub`s (`html-demo-user`, `react-demo-user`, `nextjs-demo-user`)
  so testing one doesn't burn another's quota - but repeatedly clicking
  "Authenticated mode" on the *same* example will still exhaust it. This is
  pre-existing platform rate-limiting, not embed-specific; if you hit it,
  switch the `sub` (e.g. `?sub=` on `mint-server.js`, or edit
  `nextjs-site/app/api/mint-token/route.js`) to get a fresh account.

## Going to production

Once you're happy locally, the only things that change:

1. `VIDYA_BASE` becomes `https://vidyaai.co`.
2. Your real backend mints the token (the Next.js example's API route is the
   template - HTML/React sites need an equivalent endpoint on whatever
   backend they have, exactly like `mint-server.js` simulates but with real
   auth in front of it).
3. Provision a real tenant (`provision_embed_client.py`) instead of reusing
   `xyz_learn`'s test secret.
4. Tighten the resize listener's `postMessage` target origin check on your
   side, and the `e.origin` check on the host page, to the real Vidya origin
   (already done in the examples above).

See [embed-integration.md](../../vidya_ai_backend/embed-integration.md) for
the customer-facing version of these snippets.
