# Plan: Persistent / Auto-Refreshing Embed Session

> Status: implemented. Both changes described below are live in
> `vidya_ai_frontend/src/components/generic/utils.jsx` and
> `vidya_ai_frontend/src/hooks/useEmbedSession.js`.

## Context

Third-party sites embed Vidya AI in an iframe (`/embed/chat`, `/embed/assignments`) by
minting a short-lived (5 min) handoff JWT and passing it as `?token=`. The Vidya frontend
exchanges that JWT once, at mount, for a Firebase custom token, then signs into Firebase
(`signInWithCustomToken`). From then on, the embedded session is carried entirely by
Firebase's own ID token (1hr lifetime) + refresh token (long-lived, doesn't expire by time).

The reported symptom: the embed dies after "~50 minutes or so." We traced this to:
Firebase's JS SDK refreshes ID tokens proactively via an internal `setTimeout`-based timer
a few minutes before the 1hr expiry — and that timer is exactly the kind of thing browsers
throttle/suspend for backgrounded or non-focused iframe tabs (a near-universal condition
for an embedded widget on someone else's page). When that proactive refresh doesn't fire,
nothing in the current codebase recovers: there is no `getIdToken(true)` (forced refresh)
call anywhere, and no 401 response interceptor — confirmed by grepping the whole frontend
(`src/components/generic/utils.jsx` only has a 429 response interceptor). The original
5-minute handoff JWT in the URL is long expired by the time this happens, so it can't be
reused either.

The fix doesn't need to nail the exact browser-throttling mechanism — it needs to stop
depending on Firebase's internal timer firing reliably, and instead force-refresh
(a) reactively, the moment a request actually fails with 401, and (b) proactively, on a
heartbeat well under the 1hr token lifetime. This is a frontend-only fix. The backend's
short-lived handoff JWT (5 min `exp`, `EMBED_MAX_TOKEN_AGE_SECONDS`) is an intentional
security boundary for the *bootstrap* step and is unrelated to sustaining the long-running
session — it should not be loosened.

Goal: the embed session never visibly expires to the end user, indefinitely, without any
change to how third-party sites mint/use the handoff token.

## Architecture today (for reference)

```
Third-party site iframe -> /embed/chat?token=<jwt>            (5-min handoff JWT)
  -> useEmbedSession.js: POST /api/embed/session { token }
  -> backend verify_embed_token() + mint_embed_session()      (embed_auth.py)
  -> { firebase_token, course_id, video_id, user_type }
  -> signInWithCustomToken(auth, firebase_token)               (one-time, at mount)
  -> ongoing API calls via shared `api` axios instance         (utils.jsx)
     request interceptor: Authorization: Bearer <getIdToken()> (no force, no retry)
```

Key files:
- `vidya_ai_frontend/src/hooks/useEmbedSession.js` — one-time token exchange + Firebase sign-in
- `vidya_ai_frontend/src/components/generic/utils.jsx` — shared axios instance, request/response interceptors (lines ~33-81)
- `vidya_ai_frontend/src/firebase/config.js` — Firebase client init, default persistence
- `vidya_ai_backend/src/utils/embed_auth.py` — handoff JWT verification, custom token minting
- `vidya_ai_backend/src/routes/embed.py` — `/api/embed/session`, `/api/embed/demo-session`

## Changes

### 1. `vidya_ai_frontend/src/components/generic/utils.jsx` — force-refresh on 401, retry once

Added 401 handling to the existing response interceptor (which previously only handled
429), ahead of the 429 block:

- On the first 401 for a given request (guarded by a `_retried` flag set on
  `error.config`, to prevent loops), call `auth.currentUser.getIdToken(true)` to force a
  real refresh, attach the new token, and retry the original request once via
  `api(originalRequest)`.
- Dedupe concurrent refreshes: if several in-flight requests 401 at the same moment,
  only the first should trigger a real `getIdToken(true)` call; the rest should await
  that same in-flight promise (a small module-level `refreshPromise` variable, cleared
  in a `.finally()`).
- Guard on `auth?.currentUser` before attempting a refresh, so a fully-signed-out state
  falls through to the existing rejection path instead of throwing.
- If the forced refresh itself fails (e.g. revoked refresh token), fall through to
  rejecting with the original error — there's no way to recover from inside the iframe
  in that case (would need a fresh handoff token from the host page), and that's an
  accepted, out-of-scope edge case.

This belongs on the *shared* `api` instance (not a new embed-only instance) deliberately:
every other authenticated call in the app already routes through it, and self-healing an
expired ID token is correct behavior everywhere, not just in embeds. A 401 specifically
means "your token is bad" — retrying once with a freshly forced token is the correct
interpretation of that status code, not scope creep.

### 2. `vidya_ai_frontend/src/hooks/useEmbedSession.js` — proactive refresh heartbeat

In the same `useEffect`/`exchange()` that calls `signInWithCustomToken` and sets
`status: 'ready'`: after success, a `setInterval` (~10 minutes — comfortably under
Firebase's 60-minute ID token TTL even if some ticks are throttled) calls the same
`refreshIdToken()` helper added in change 1 above (re-exported from `utils.jsx` rather
than calling `getIdToken(true)` independently, so a heartbeat tick and a concurrent
401-triggered refresh can never both hit Firebase at once — they share the same in-flight
dedupe promise). The interval is cleared in the effect's existing cleanup function
alongside the existing `cancelled = true` line.

No new hook file — the heartbeat is a direct continuation of "the exchange succeeded, now
keep it alive," not an independent concern, so it belongs in the same effect/cleanup as
the exchange itself (unlike `useEmbedResize.js`, which is genuinely independent of
session state and is a fine pattern to mirror for *that* kind of standalone concern, just
not this one). This also automatically covers `?demo=true` sessions, since both branches
flow through the same shared success path before the heartbeat is started.

The heartbeat is best-effort (errors swallowed) — the interceptor from step 1 is the real
correctness guarantee on the next actual API call; the heartbeat just makes hitting a 401
in the first place much less likely.

### Not changing

- Backend (`vidya_ai_backend/src/utils/embed_auth.py`, `routes/embed.py`): the handoff
  JWT's short lifetime is intentional and unrelated to sustaining the session.
- Firebase persistence config (`vidya_ai_frontend/src/firebase/config.js`): this is a
  same-tab-lifetime problem, not a reload-survival problem; default persistence is fine.
  Reload-survival (a host page reloading the iframe) is already documented as requiring
  the host page to mint a fresh handoff token per load, which is correct and unrelated.

## Edge cases considered

1. **Global 401 retry affecting non-embed app code** — safe and desirable, not added
   risk. Every other authenticated call (TopBar, materialChatApi, assignmentApi,
   PricingPage, ChatBoxComponent) already routes through the same shared `api` instance,
   so they'd benefit from the same self-healing behavior. Doesn't mask real bugs: a 403
   (unauthorized for a resource) is untouched; only 401 (bad/expired token) triggers the
   retry.
2. **Demo mode (`?demo=true`)** — covered automatically; both branches of `exchange()`
   flow through the same shared success path before the heartbeat starts.
3. **Tab backgrounded so heavily the heartbeat interval never fires** — not actionable
   from inside the iframe; accepted. The 401 interceptor is the backstop: the next real
   user interaction after the tab becomes active again triggers a forced refresh+retry
   transparently (a few hundred ms of extra latency, no visible error).
4. **Refresh token revoked / Firebase user disabled** — `getIdToken(true)` throws in both
   the heartbeat (swallowed) and the interceptor retry (falls through to the original
   401). No in-iframe recovery is possible in this case (would need a fresh handoff token
   from the host page) — explicitly out of scope.
5. **`auth.currentUser` null when a 401 arrives** — guarded, falls through to plain
   rejection instead of throwing.
6. **Retry preserves request config** — passing the same mutated `originalRequest` object
   back into `api(originalRequest)` preserves any other axios config (timeout, abort
   signal, upload progress handler, etc.) automatically.

## Follow-up considered, deliberately deferred

Code review for this change flagged that the root cause (Firebase's proactive refresh
timer getting throttled in a backgrounded tab) isn't actually embed-specific — any
long-lived tab in the regular app could hit the same gap, recovering only reactively via
change 1's 401 retry rather than proactively. The suggested generalization was lifting the
heartbeat out of `useEmbedSession.js` into `AuthContext.jsx`'s existing
`onAuthStateChanged` effect, so every authenticated session gets the proactive heartbeat,
not just embeds. Deferred for now since it broadens this fix beyond the embed-scoped
problem that was actually reported, and beyond what `vidya_ai_frontend/docs/embed-tutorial.md`
exists to support — worth revisiting if the same "session goes stale on a long-idle tab"
complaint shows up for the regular (non-embed) app.

## Verification

- Manual: load `/embed/chat?demo=true` locally, confirm the heartbeat interval is set
  after the session reaches `status: 'ready'`, and confirm no duplicate intervals stack
  up under React StrictMode's double-invoke in dev.
- Force a 401 (e.g. temporarily have a backend route reject the first request) and
  confirm in the Network tab: exactly two requests fire (original 401, then one retry
  with a new `Authorization` header), not an infinite loop, and the UI never shows an
  error for that request.
- Confirm regular (non-embed) authenticated flows still work unaffected (login, chat,
  assignments) since the interceptor change is on the shared `api` instance.
