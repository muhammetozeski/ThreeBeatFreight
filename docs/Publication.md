# Publication and acceptance

The public source is https://github.com/muhammetozeski/ThreeBeatFreight and the first verified live origin is https://three-beat-freight.pages.dev/. The project is independent of BinSite. It uses free Cloudflare Pages and a dedicated D1 database; no domain or paid plan was purchased.

GitHub Actions builds .NET 10 Blazor, copies/checks the exact shared game modules, and deploys Pages Functions using Wrangler. Secrets are GitHub/Cloudflare configuration, never source files. `docs/hosting.json` contains public resource identifiers. The workflow uses direct upload; it does not depend on a Cloudflare build environment containing .NET. D1 schema was applied before first deployment through the Cloudflare API.

First release `a779a21`, [successful workflow 40119242442](https://github.com/muhammetozeski/ThreeBeatFreight/actions/runs/40119242442), passed 38 real HTTPS checks. They verified HTML/framework/readability assets, dark markup, browser game bytes against committed Git blobs, two distinct test identities, outsider refusal, hidden pending commands, immutable commit refusal, reveal, two actual D1-backed deliveries, stale request preserving scores/version, replay count, recovery reconnect and foreign-origin refusal. These temporary QA identities and room rows were then removed through the database API. They are not users or audience statistics.

Those HTTP checks did not click through a graphical browser, measure a twenty-second delivery, establish game enjoyment or verify live advertising/payment. Local Release compilation and publish both completed with zero compiler warnings/errors; the installed cache restored the .NET10.0.11 packages offline. No local tool or package download was needed. The hosted build acquired its own dependencies on the CI runner.

The initial live check compared exact remote bytes with committed Git blobs. Comparing against a Windows working copy instead would mix Git line-ending conversion into the test. `.gitattributes` fixes new text output to LF; the build also verifies source/output hashes within the same publication environment.

See [Cloudflare Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) for the D1 binding and [deployment API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/create/) for direct-upload behavior.
