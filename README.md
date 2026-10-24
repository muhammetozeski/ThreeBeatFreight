# Three Beat Freight

Play the live game at **https://three-beat-freight.pages.dev/**. Public source: https://github.com/muhammetozeski/ThreeBeatFreight.

Program three commands, watch every courier resolve together, spill a rival's cargo and bring yours home. The original game includes twelve freight yards, 24 solo dispatches, an openly labeled local automated rival, a UTC featured dispatch, real 2–4-person private rooms, beat/round replays, a visual arena maker and portable arena/replay files. Solo uses the same deterministic module as the live service and needs no account/key. A free courier unlocks real rooms, recovery and three private cloud arena slots.

The interface defaults to dark and includes a computed-contrast repair guard. Product content is English. No invented players, traffic, payments or promised earnings are presented. The current payment/advertising adapters remain unavailable until the owner supplies actual approved account configuration. The optional Plus feature concerns cloud arena capacity; the complete current game and local/file workflows remain free.

## Source map

- `game/`: one shared engine, authored arenas/contracts and local rival.
- `src/ThreeBeatFreight.Client/`: .NET 10 Blazor client and browser bridge.
- `server/`, `functions/`, `schema/`: D1 identity/rooms/hidden commitments, locker and optional revenue adapters.
- `scripts/Build.ps1`: publishes the client and verifies shared module copies.
- `scripts/Configure-Revenue.ps1`: owner-operated secret-safe provider setup.
- [Project knowledge](docs/INDEX.md) and [dated continuation records](Walkthrough/Guide.md).

Use `pwsh -File scripts/Build.ps1` from this repository to build. The installed-cache development build also accepts `-NoRestore`. `wrangler.toml` identifies the free Pages/D1 resources; credentials live in GitHub/Cloudflare secrets, never this source. `.github/workflows/publish.yml` deploys pushes to main.

See [Publication](docs/Publication.md) for actual HTTP evidence and its limits, [Rules and service](docs/Rules-and-Service.md) for protocol behavior, and [Revenue and locker](docs/Revenue-and-Locker.md) for controlled versus live integration evidence. This permanent project is one game; maps and templates are not counted as separate products.
