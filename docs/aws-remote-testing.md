# Tutorial: Running Vidya AI on an AWS Box and Testing From Another PC

A walkthrough for the common dev setup where the backend and frontend run on
a remote machine (an EC2 instance, say) but you want to click through the app
from your own laptop's browser. This is a different scenario from
[embed-tutorial.md](./embed-tutorial.md), which assumes everything - backend,
frontend, and browser - is on the same machine. Here, the browser is remote,
which changes which hostnames/ports actually work and adds a network layer
(Security Groups) that doesn't exist in the fully-local case.

## How it's different from local-only dev

```
Your laptop                          AWS box (EC2, etc.)
  |                                    |
  |  browser -> http://<PUBLIC_IP>:3000  -> Next.js dev server (frontend)
  |  browser -> http://<PUBLIC_IP>:8001  -> uvicorn (backend)
  |                                    |
  (needs Security Group inbound        (binds 0.0.0.0, not 127.0.0.1)
   rules for both ports)
```

The key thing that breaks if you copy a "works on localhost" setup verbatim:
**`localhost` in the browser means your laptop**, not the AWS box. Since
nothing is running on your laptop, every API call fails with
`ERR_CONNECTION_REFUSED`. Everything below exists to get real hostnames/ports
in front of the browser instead.

## 1. Find your AWS box's public IP

```bash
curl -s ifconfig.me   # run this ON the AWS box
```

You'll use this IP (call it `<PUBLIC_IP>`) everywhere below instead of
`localhost`.

## 2. Open the ports in the Security Group

The browser on your laptop talks to **both** the frontend and the backend
directly (this app doesn't proxy API calls through Next.js), so both ports
need inbound rules:

- AWS Console -> EC2 -> your instance -> **Security** tab -> the security
  group -> **Edit inbound rules**
- Add: Custom TCP, port `3000` (frontend), source = your IP or `0.0.0.0/0`
- Add: Custom TCP, port `8001` (backend), source = your IP or `0.0.0.0/0`

This can't be verified from inside the box - `curl localhost:8001` or even
`curl <PUBLIC_IP>:8001` *from the box itself* will succeed regardless of
Security Group rules, since that traffic doesn't cross the AWS network
boundary. The only real test is hitting it from your laptop (step 6).

## 3. Start the backend, bound to all interfaces

```bash
cd vidya_ai_backend/src
../vidyaai_env/bin/uvicorn main:app --host 0.0.0.0 --port 8001
```

`--host 0.0.0.0` is required - the default (`127.0.0.1`) only accepts
connections from the box itself, which would silently work for every `curl
localhost` check you run while SSH'd in and then fail for the actual
laptop-to-box request.

> **Gotcha:** `vidya_ai_backend/.env`'s `DATABASE_URL` password must match
> your Postgres user's *actual* password, not whatever placeholder is in the
> repo/example file. A mismatch shows up as a `500` on every DB-backed route,
> which the browser may report as a **CORS error** instead of a clean 500 -
> FastAPI's CORSMiddleware doesn't always attach headers to responses from
> unhandled exceptions, even when your origin is in `allow_origins`. If you
> see a CORS error in the console, check the backend's own log/terminal for
> the real exception before assuming it's a CORS config problem. Special
> characters in the password (e.g. `@`) need URL-encoding in the connection
> string (`@` -> `%40`).

Confirm it's up, locally on the box:

```bash
curl http://localhost:8001/
```

## 4. Start the frontend, pointed at the box's public IP

```bash
cd vidya_ai_frontend
NEXT_PUBLIC_API_BASE_URL=http://<PUBLIC_IP>:8001 NEXT_PUBLIC_NODE_ENV=local-test npm run dev
```

> **Gotcha (same one noted in embed-tutorial.md):**
> `src/components/generic/utils.jsx` hard-overrides the API URL when
> `NEXT_PUBLIC_NODE_ENV` is `development`, `production`, or `local` - any of
> those silently ignore `NEXT_PUBLIC_API_BASE_URL` and point at a remote API
> instead. Use any other value (e.g. `local-test`) so your explicit
> `NEXT_PUBLIC_API_BASE_URL` actually takes effect.

> **Gotcha:** these `NEXT_PUBLIC_*` values get baked into the JS bundle at
> dev-server start, not read live per-request. If you instead put them in
> `.env.local` and the dev server was already running with old values, a
> plain restart isn't always enough - Next.js's webpack persistent cache
> (`.next/cache`) can keep serving the old baked-in literals across restarts.
> If env values don't seem to update after a restart, run `rm -rf .next` in
> `vidya_ai_frontend` before starting the dev server again.

Confirm it's up, locally on the box:

```bash
curl http://localhost:3000/embed/chat -o /dev/null -w "%{http_code}\n"   # 200
```

## 5. Sanity-check from the box before involving your laptop

```bash
ss -tlnp | grep -E ":3000|:8001"   # both should show 0.0.0.0, not 127.0.0.1
curl -s http://localhost:8001/api/embed/demo-session   # should return JSON, not a 500
```

If `demo-session` 500s here, fix that first - it'll fail identically from
your laptop and is unrelated to networking/Security Groups.

## 6. Test from your laptop

Open, from your laptop's browser (not the AWS box):

```
http://<PUBLIC_IP>:3000/embed/assignments?demo=true
http://<PUBLIC_IP>:3000/embed/chat?demo=true
```

Open devtools -> Console while loading. You should see logs like:

```
NODE_ENV local-test
API_BASE_URL from env http://<PUBLIC_IP>:8001
Final API_URL http://<PUBLIC_IP>:8001
```

No `localhost` anywhere, no `ERR_CONNECTION_REFUSED`, no CORS errors.

## Troubleshooting

- **`ERR_CONNECTION_REFUSED` to `localhost:____`** - the bundle still has
  `localhost` baked in. Check what command actually started the dev server
  (inline env vars override `.env.local` entirely - if both are set,
  whichever was passed on the command line wins) and re-check step 4's
  gotchas.
- **Same stale values in console after fixing `.env.local` and restarting**
  - clear `.next/cache` (step 4's second gotcha) and restart.
- **Works via `curl` on the box, `ERR_CONNECTION_REFUSED` from laptop** -
  Security Group, not the app. Re-check step 2; remember a same-box `curl`
  to the public IP doesn't exercise the Security Group at all.
- **CORS error in the browser console** - check the backend's terminal/log
  for the actual exception first (see step 3's gotcha). Only treat it as a
  real CORS config issue if the backend returned a clean `200`/`4xx` and the
  header was genuinely missing - confirm with:
  ```bash
  curl -s -D - http://localhost:8001/<route> -H "Origin: http://<PUBLIC_IP>:3000" -o /dev/null
  # look for: access-control-allow-origin: http://<PUBLIC_IP>:3000
  ```
- **Need to find/stop whatever's currently running on a port** -
  ```bash
  ss -tlnp | grep :<port>        # find the PID
  ps -p <pid> -o pid,ppid,cmd    # see what it actually is before killing it
  kill <pid>
  ```

## Going further

For the embed-specific integration walkthrough (third-party HTML/React/
Next.js sites, JWT minting, iframe resize) once both servers are reachable
from your laptop, continue with [embed-tutorial.md](./embed-tutorial.md) -
just substitute `http://<PUBLIC_IP>:3000` everywhere it says
`http://localhost:3000`.
