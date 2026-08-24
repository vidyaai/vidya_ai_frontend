# Tutorial: Testing the Embed Flow — Vidya AI on AWS, Third-Party Sites on Your MacBook

This combines two existing docs into one walkthrough:
[aws-remote-testing.md](./aws-remote-testing.md) (running Vidya AI's own
backend/frontend on a remote AWS box) and [embed-tutorial.md](./embed-tutorial.md)
(the three example "third-party site" projects under [`docs/examples/`](./examples/)
that simulate a customer embedding Vidya AI). Read those two first if anything
below is unclear — this doc only adds the missing piece: running the *example*
projects from your MacBook against a Vidya AI that's running on AWS, instead of
on the same machine.

## How it fits together

```
Your MacBook                                    AWS box (EC2)
  |                                                |
  |  mint-server.js (:4001)   ----curl---->        |
  |  html-site (:5500)        --(fetch token,        |
  |  react-site (:5173)         then set iframe   |
  |  nextjs-site (:4002)         src)-----------> Vidya AI frontend (:3000)
  |                                  |                |  -> Vidya AI backend (:8001)
  |  browser opens html/react/nextjs-site,            |
  |  which embeds an <iframe src="http://<PUBLIC_IP>:3000/embed/...">
```

The example projects (and the browser) live on your MacBook; **Vidya AI's own
backend and frontend live on the AWS box**. The only thing that changes
compared to running everything locally is: every place the examples currently
hard-code `http://localhost:3000` needs to point at the AWS box's public IP
instead.

This specific AWS box's public IP (`54.153.26.252`) is already baked into
`vidya_ai_backend/src/main.py`'s CORS `allow_origins` list and into
`vidya_ai_frontend/src/components/generic/utils.jsx`'s `NODE_ENV === 'local'`
fallback — so if that's still the right box, you can skip straight to step 1.
If it's a different/new box, get its IP first:

```bash
curl -s ifconfig.me   # run this ON the AWS box
```

and add `http://<PUBLIC_IP>:3000` to the backend's CORS `allow_origins`
(`vidya_ai_backend/src/main.py`, around line 80) before continuing — without
that, every API call from the embed iframe will fail with a CORS error.

## 1. Start Vidya AI's backend and frontend on the AWS box

Full detail (Security Group rules, the `NEXT_PUBLIC_NODE_ENV` gotcha, the
`.next/cache` gotcha) is in [aws-remote-testing.md](./aws-remote-testing.md) —
condensed here:

```bash
# On the AWS box, Security Group must allow inbound 3000 and 8001 first.

# Backend
cd vidya_ai_backend/src
../vidyaai_env/bin/uvicorn main:app --host 0.0.0.0 --port 8001

# Frontend (separate terminal/session)
cd vidya_ai_frontend
NEXT_PUBLIC_API_BASE_URL=http://<PUBLIC_IP>:8001 NEXT_PUBLIC_NODE_ENV=local-test npm run dev
```

> **Gotcha:** use `NEXT_PUBLIC_NODE_ENV=local-test`, not `development`/
> `production`/`local` — those three values make `utils.jsx` silently ignore
> `NEXT_PUBLIC_API_BASE_URL` and point at a different API instead.

Confirm from the box itself:

```bash
curl http://localhost:8001/                                              # backend up
curl http://localhost:3000/embed/chat -o /dev/null -w "%{http_code}\n"   # 200
curl http://localhost:8001/api/embed/demo-session                        # JSON, not a 500
```

Also confirm `EMBED_MAX_TOKEN_AGE_SECONDS` is generous for testing (production
should **not** set this):

```bash
grep EMBED_MAX_TOKEN_AGE_SECONDS vidya_ai_backend/.env
# EMBED_MAX_TOKEN_AGE_SECONDS=3600
```

If it's missing, add it to `vidya_ai_backend/.env` and restart `uvicorn` —
otherwise handoff JWTs go stale after 5 minutes regardless of their `exp`,
which is annoying mid-test.

## 2. Provision a test embed tenant on the AWS box

The example projects need a tenant slug + `embed_secret` that exists in
**this box's** database (the well-known `xyz_learn` secret baked into
`docs/examples/mint-server.js` and `.env.local.example` belongs to a
*different* (local-dev) database and won't verify against this one).

```bash
# Still on the AWS box
cd vidya_ai_backend/src
../vidyaai_env/bin/alembic upgrade head   # only if embed_clients table doesn't exist yet
../vidyaai_env/bin/python -m scripts.provision_embed_client xyz_learn "XYZ Learn"
```

```
slug=xyz_learn
embed_secret=<freshly generated, different from the one in docs/examples>
```

Copy that `embed_secret` — you'll paste it into the example projects' config
in step 3. If you get `Embed client with slug 'xyz_learn' already exists.`,
either reuse whatever secret was generated the first time this box was
provisioned, or pick a different slug (e.g. `xyz_learn_macbook_test`) and use
that everywhere below instead.

## 3. Point the example projects at the AWS box

Back on your **MacBook**, every example currently hard-codes
`http://localhost:3000` as `VIDYA_BASE` and assumes the local-dev
`xyz_learn` secret. Update both:

| File | Change |
|---|---|
| `docs/examples/html-site/index.html` | line ~31: `VIDYA_BASE = 'http://<PUBLIC_IP>:3000'` |
| `docs/examples/react-site/src/VidyaEmbed.jsx` | line ~4: `VIDYA_BASE = 'http://<PUBLIC_IP>:3000'` |
| `docs/examples/nextjs-site/.env.local` (copy from `.env.local.example`) | `NEXT_PUBLIC_VIDYA_BASE_URL=http://<PUBLIC_IP>:3000` |
| `docs/examples/mint-server.js` | no edit needed — pass the new secret via env var instead (step 4) |
| `docs/examples/nextjs-site/.env.local` | `VIDYA_EMBED_SECRET=<secret from step 2>` |

## 4. Run `mint-server.js` (MacBook)

Used by the HTML and React examples (the Next.js example mints its own token
server-side instead). Override the secret via env var rather than editing the
file:

```bash
cd vidya_ai_frontend/docs/examples
VIDYA_EMBED_SECRET=<secret from step 2> node mint-server.js
# Mint server running at http://localhost:4001/mint-token
```

Sanity check:

```bash
curl http://localhost:4001/mint-token
# {"token":"eyJ..."}
```

## 5. HTML site (MacBook)

```bash
cd vidya_ai_frontend/docs/examples/html-site
python3 -m http.server 5500
```

Open `http://localhost:5500/`. Click **"Load demo mode"** (talks straight to
the AWS box, no token needed) and **"Load authenticated mode"** (fetches a
token from `mint-server.js` on :4001, then sets the iframe `src` to
`http://<PUBLIC_IP>:3000/embed/chat?token=...`).

## 6. React site (MacBook)

```bash
cd vidya_ai_frontend/docs/examples/react-site
npm install
npm run dev
```

Open the printed Vite URL (typically `http://localhost:5173`). Same two
buttons, same behavior.

## 7. Next.js site (MacBook)

```bash
cd vidya_ai_frontend/docs/examples/nextjs-site
npm install
npm run dev
```

Open `http://localhost:4002`. "Authenticated mode" calls its own
same-origin `/api/mint-token` route (no CORS to worry about, and
`VIDYA_EMBED_SECRET` never reaches the browser), which mints the token using
the `.env.local` values from step 3.

## 8. Run all three at once

| Process | Machine | Port |
|---|---|---|
| Vidya backend | AWS box | 8001 |
| Vidya frontend | AWS box | 3000 |
| mint-server.js | MacBook | 4001 |
| html-site | MacBook | 5500 |
| react-site | MacBook | 5173 |
| nextjs-site | MacBook | 4002 |

Open all three demo pages side by side on your MacBook and click through both
modes (demo / authenticated) on each — same acceptance matrix as the fully
local version of this tutorial, just with Vidya AI itself running remotely.

## 9. Embedding on an external HTTPS site (e.g. Google Sites)

If you want to go a step further than the example projects and embed against
a real external page — for instance
`https://sites.google.com/view/pingakshya-goswami/home` — there's one extra
wrinkle: Google Sites is served over **HTTPS**, while the AWS box above is
plain **HTTP**. Browsers block HTTPS pages from framing HTTP content ("mixed
content"), so a direct `http://<PUBLIC_IP>:3000/embed/...` iframe renders
blank with a console error like:

```
Mixed Content: The page at 'https://sites.google.com/...' was loaded over
HTTPS, but requested an insecure frame 'http://<PUBLIC_IP>:3000/...'.
```

### Option A — quick visual check (your browser only)

1. Open the Google Sites page in Chrome.
2. Click the site-info icon (left of the URL) → **Site settings** → set
   **Insecure content** to **Allow**, then reload.
3. In the Sites editor, where you want the embed (e.g. a new section placed
   after "Contact" — see below), insert an **Embed** block → **Embed code**,
   and paste an iframe pointed at the AWS box, e.g.:
   ```html
   <iframe
     src="http://<PUBLIC_IP>:3000/embed/chat?demo=true"
     width="100%" height="800" style="border:0"
     allow="microphone; camera; clipboard-write">
   </iframe>
   ```
4. Publish/preview. This only renders correctly in *your* browser with the
   flag set — good for confirming layout/sizing inside the Sites page, not
   representative of what a real visitor (without the flag) would see.

### Option B — full HTTPS test via a tunnel (what real visitors would see)

```bash
# On the AWS box, or anywhere that can reach it
cloudflared tunnel --url http://localhost:8001   # -> backend HTTPS URL
cloudflared tunnel --url http://localhost:3000    # -> frontend HTTPS URL
```

1. Add the backend tunnel's HTTPS origin to `allow_origins` in
   `vidya_ai_backend/src/main.py`'s `CORSMiddleware` config (temporary —
   revert after testing).
2. Restart the frontend with
   `NEXT_PUBLIC_API_BASE_URL=<backend tunnel URL> NEXT_PUBLIC_NODE_ENV=local-test npm run dev`.
3. Use the frontend tunnel's HTTPS URL as `VIDYA_BASE` everywhere (the
   example projects, or the iframe `src` directly).
4. In the Sites editor, **Embed code** with the tunnel URL instead of
   `http://<PUBLIC_IP>:3000` — this is now real HTTPS-to-HTTPS, same as
   production.

Revert the CORS/env changes from Option B once you're done.

### Adding a "Test Vidya AI" section to the page

In the Google Sites editor: open the page, scroll to the end of the existing
"Contact" section, hover the gap right below it until the **Insert** controls
appear, add a new section/heading text "Test Vidya AI", then insert an
**Embed** block under that heading using one of the iframe snippets above.
Both `/embed/chat` (chat + video) and `/embed/assignments` (the LMS view) can
be added as separate embed blocks in that section if you want both visible at
once.

### Testing the chat + LMS views, student vs. professor

The embed only supports two identities today, neither of which is "log in
with the same Vidya account/Google login you use on vidyaai.co directly":

- **`?demo=true`** — anonymous, shared demo account, always `student`.
- **`?token=<jwt>`** — a tenant-namespaced account, isolated from any account
  you have on the main site. `mint-server.js` (step 4) and the Next.js
  example's API route both accept `?role=professor` / `role: 'professor'` to
  mint a token that signs into a *professor-type* embed account instead of a
  student one, e.g.:
  ```
  http://localhost:4001/mint-token?sub=test-professor&role=professor
  ```
  Use the returned token as `?token=...&v=<videoId>` on `/embed/chat`, or just
  `?token=...` on `/embed/assignments`, to see the professor-side LMS UI
  (assigning/grading rather than completing assignments).

This lets you exercise both roles end-to-end, but it's a separate,
tenant-scoped account — not literally your `pingakshya2008@gmail.com`
professor account from the main app. Making the embed sign in as *your own*
existing Vidya account (so the same courses/data show up) is a different,
not-yet-built feature; worth a separate discussion if you want that instead of
(or in addition to) the tenant-handoff model above.

## Troubleshooting

Carries over directly from [aws-remote-testing.md](./aws-remote-testing.md)'s
troubleshooting section (`ERR_CONNECTION_REFUSED`, stale baked-in env values,
Security Group vs. CORS confusion) and
[embed-tutorial.md](./embed-tutorial.md)'s (missing token, token
expired/too old, iframe not resizing) — a few additions specific to this
AWS+MacBook combination:

- **CORS error from the embed iframe, but `curl` from the AWS box works
  fine** — the iframe's origin (`http://<PUBLIC_IP>:3000`) isn't in the
  backend's `allow_origins` list. Check `vidya_ai_backend/src/main.py` around
  line 80; this specific box's IP (`54.153.26.252`) is already listed, a new
  box's won't be.
- **`mint-server.js` returns a token, but `/api/embed/session` on the AWS box
  says `401 Unknown tenant`** — the slug in the token's `iss` claim doesn't
  exist in *this* box's database. Re-run step 2 on the AWS box, not your
  MacBook.
- **`401 Token invalid` even though the slug is right** — the secret baked
  into `mint-server.js`'s default / `.env.local.example` is for a different
  (local) database. Make sure you're passing the secret printed by step 2's
  `provision_embed_client` run via `VIDYA_EMBED_SECRET`, not the example's
  hard-coded default.
- **Mixed content blocked** — only relevant once you're embedding in a real
  HTTPS site (section 9); not an issue for the example projects above, which
  all run over plain HTTP on your MacBook.
