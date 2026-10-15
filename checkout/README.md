# Checkout return page

Polar redirects here after a CrossOver Pro purchase (checkout link `success_url`:
`https://<this host>/?checkout_id={CHECKOUT_ID}`). The page polls `/api/key`,
which looks up the license key with a Polar org token, then opens
`crossover://activate?key=...` so the app activates itself. The key stays on
the page with a copy button for builds without the protocol handler.

Deploy: `vercel --prod` from this folder. Env: `POLAR_ACCESS_TOKEN`
(org token with checkouts:read, benefits:read, license_keys:read).
