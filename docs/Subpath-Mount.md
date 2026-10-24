# Three Beat Freight on a shared origin

The same source supports its existing standalone root and an isolated mount at `/three-beat-freight/`. The standalone workflow still invokes `scripts/Build.ps1` without a base argument. No production configuration, schema, account, room, plan, replay or saved yard was changed while preparing this integration.

## Build and static files

From this repository:

```powershell
pwsh -NoLogo -NoProfile -File ./scripts/Build.ps1 -NoRestore -BasePath /three-beat-freight/
```

Omit `-NoRestore` when the pinned checkout has not restored its existing .NET dependencies. `-Destination` optionally selects the final static folder; relative paths are resolved from this repository. Its default remains `artifacts/site`. The main integration passes its absolute `public/three-beat-freight/` directory. This is a separate Blazor bundle: the main site's entry link must load that document rather than render it through the main site's client router.

The build writes the mounted `<base>` into the output index without changing the root-based source index. Framework resources, module imports, stylesheet/script/icon URLs, navigation, privacy and reload links resolve under that base. The browser API bridge derives its API and invitation root from `document.baseURI`. Published `_headers` rules use the prefix; the root integrator merges these into its actual root `_headers`. The child metadata alone cannot apply hosting headers. Mounted `_routes.json` lists only `/three-beat-freight/api/*`; the integrator owns the combined root invocation file.

There is one game page plus its real `privacy.html`. No catchall SPA rewrite is required or added. No service worker is installed by this product. No new CSP relaxation was added; the root policy must retain its existing Blazor runtime allowance. Optional advertising remains gated by the existing explicit configuration/CMP contract and stays disabled when unavailable.

## Functions import contract

The root wrapper is `functions/three-beat-freight/api/[[path]].js`. Its direct export calls the existing `handle(request, env)` function. Copy this exact source tree, preserving its relative imports:

```text
integrations/mounted/freight/
  server/handler.mjs
  server/http.mjs
  server/revenue.mjs
  game/engine.mjs
  game/content.mjs
```

There is no third-party JavaScript package dependency: these modules use local ESM, standard Web APIs and D1. The browser also publishes the existing `game/rival.mjs` through its assets; the server does not import it.

Example root wrapper, with an explicit whitelist and fixed canonical origin:

```javascript
import {handle} from '../../../integrations/mounted/freight/server/handler.mjs';
export const onRequest = ({request,env}) => handle(request, {
  DB: env.FREIGHT_DB,
  SITE_ORIGIN: 'https://muhammetozeski-binsite.pages.dev',
  APP_BASE_PATH: '/three-beat-freight/',
  POLAR_ACCESS_TOKEN: env.FREIGHT_POLAR_ACCESS_TOKEN,
  POLAR_PRODUCT_ID: env.FREIGHT_POLAR_PRODUCT_ID,
  POLAR_WEBHOOK_SECRET: env.FREIGHT_POLAR_WEBHOOK_SECRET,
  POLAR_MODE: env.FREIGHT_POLAR_MODE,
  ADSENSE_CONSENT_READY: env.FREIGHT_ADSENSE_CONSENT_READY,
  ADSENSE_CLIENT: env.FREIGHT_ADSENSE_CLIENT,
  ADSENSE_SLOT: env.FREIGHT_ADSENSE_SLOT
});
```

The origin is a deployment configuration, not copied from the incoming request. There is no fallback to the main site's payment/ad credentials. Missing optional keys preserve unavailable/disabled billing and advertising. Do not copy the standalone `functions/api` wrapper or `functions/ads.txt.js` over the main site's handlers. The main origin's `ads.txt` remains root-owned.

All game endpoints are beneath `/three-beat-freight/api/`, including `status`, `profile`, `recover`, `logout`, `rooms`, room actions/replays, `locker`, and `billing/checkout`, `billing/portal`, `billing/webhook`. The mounted handler rejects the main `/api/` namespace and sibling prefixes. The existing canonical-origin and same-origin mutation checks remain active. Checkout and portal return URLs use the mounted game root.

## Existing database and identity

| Item | Existing value |
| --- | --- |
| Standalone binding | `DB` |
| Main-site binding | `FREIGHT_DB`, mapped to handler `DB` |
| D1 database name | `three-beat-freight` |
| D1 database ID | `49498b36-b298-498f-bc31-1efb876650e9` |

Bind this same database. No schema migration, data copy or reset is required by this change. All profile/session/recovery hashes and game records retain their existing format and tables.

The cookie name stays `freight_session`, HttpOnly/Secure/SameSite Lax. On the new mount its path is `/three-beat-freight/api/`; frontend code never reads it. Creation, recovery and logout use the same path. The standalone default retains `Path=/` to avoid changing existing standalone sessions. Cookies and browser local saves do not automatically cross origins; a courier uses the existing recovery key on the main origin. Existing local arena/replay exports remain portable. The product-specific local-storage key is unchanged.

## Executed preparation evidence

- Current repository began clean at `bafa224` before these integration-only edits.
- PowerShell parsed the modified build script, then an actual mounted Release publish exited successfully using installed/cached dependencies. The published index, scoped headers/routes, framework script, own module and privacy page were present. The standard standalone workflow was not changed or deployed.
- Disposable consumer: `C:\C\FreightMountChecks\check.mjs`. Thirty-three assertions passed against the actual handler, browser module and built output: both root/mounted request paths; creation/recovery/logout cookie scopes; retained identity format; canonical/foreign-origin refusal; main/sibling API isolation; invalid base rejection; actual browser-module API/invite URL formation; output base/headers/invocation metadata/assets; and checkout/portal return URL formation for both bases.
- Identity queries used a small in-memory adapter; billing used controlled responses and performed no provider operation. These are subpath integration checks, not new D1/game-mechanics, browser bootstrap or live-charge claims. The game's existing SQL, resolution and engine logic were not changed or retested broadly.
- No main-site source, hosting setting, secret or deployment was changed in this preparation. The parent separately authorized committing and publishing these changes through the existing standalone workflow.
- The later `-Destination` addition was parsed and exercised once into a disposable output folder, reusing the already published client instead of compiling it again. It preserved the mounted base and scoped headers. The default destination expression remains `artifacts/site`.

## Source manifest

Changed: `scripts/Build.ps1`; `server/handler.mjs`, `server/http.mjs`, `server/revenue.mjs`; `src/ThreeBeatFreight.Client/App.razor`, `Pages/Freight.razor`, `wwwroot/index.html`, `wwwroot/privacy.html`, `wwwroot/assets/freight.mjs`; this document and its new `docs/INDEX.md` link. Existing game modules, schema, standalone Functions wrappers, workflow, CSS and appearance/consent scripts remain unchanged.
