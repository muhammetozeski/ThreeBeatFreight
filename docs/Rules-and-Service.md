# Shared rules and room boundary

The browser and server import the same `game/engine.mjs` and authored `game/content.mjs`. Build.ps1 copies both to the browser and compares SHA-256 file hashes after publication. C# owns presentation and command composition; it does not implement a second rules engine.

A plan has exactly three commands and at most four energy. Shoves precede simultaneous movement, then pickup/delivery, courier belts, hazards and replenishment. Contesting a destination or a closed movement cycle blocks that movement. Brace stops shoves and belts. Shoves spill held cargo; hazard recovery never eliminates a courier. Solo objectives and live six-round scoring use this same resolution function.

## Real room information

Guest identity is a server-issued random ID with a chosen alias, Secure/HttpOnly/SameSite browser cookie, hashed token and separately hashed recovery key. Recovery is a bearer credential, shown once. A session lasts 30 days; logout deletes it. The service never substitutes invented participants. Room start requires 2–4 actual registered identities, not one identity in two seats.

`plans` rows are private to their owner until resolution. GET room returns public state, member IDs, committed IDs, the requesting courier's own plan and only the previous resolved replay. It never returns an opponent's pending command. Committing different commands for the same round is refused; the first valid commitment is retained. A duplicate old request cannot score again.

`pump()` resolves when every player submitted or when the 90-second deadline has passed. Deadline resolution happens on the next room request, not from a background timer. Missing submissions become waits and their IDs are listed in replay. A version-and-round conditional UPDATE plus transactionally guarded replay insertion commits one resolution. A losing concurrent resolver re-reads the winning state. Server state and scores are never accepted from the browser.

## Endpoints

All POST routes require the same Origin as the site. JSON bodies are bounded at 16 KB. SQL parameters are bound. Errors expose actionable validation, but unexpected logs contain only error type. Minute rate buckets cap requests; expired rate buckets and sessions are periodically removed.

- GET `/api/status`: actual user or null and service availability.
- POST `/api/profile` `{alias}`: user and one-time recoveryKey; session cookie.
- POST `/api/recover` `{recoveryKey}` and POST `/api/logout`.
- GET `/api/rooms`: this courier's last 30 rooms.
- POST `/api/rooms` `{arenaId}` or `{arena}`: private lobby; bounded 12 creations per host/hour.
- POST `/api/rooms/:id/join`: join a lobby, or reconnect as an existing member.
- POST `/api/rooms/:id/start`: host only; concurrent member count checked.
- GET `/api/rooms/:id`: membership required; may finish a due resolution.
- POST `/api/rooms/:id/plan` `{round,plan}`: private immutable commitment.
- GET `/api/rooms/:id/replays`: members only, completed rounds only.

## Observed evidence

A disposable consumer fixture imported production modules and used node:sqlite with the real SQL schema. 38 assertions passed: solo first delivery in two rounds; unchanged input and deterministic replay; budget and state rejection; shove/spill/interception; actual separate test identities; outsider refusal; pre-reveal plan secrecy; commitment lock; two-plan resolution; stale retry refusal; two concurrent deadline pumps producing one version/replay; and recovery reconnect. These are controlled tests, not audience or human enjoyment measurements. The Release C# build completed with zero warnings and zero errors.

Production HTTP verification is recorded separately after deployment. Source contracts do not by themselves prove production transport or browser rendering.
