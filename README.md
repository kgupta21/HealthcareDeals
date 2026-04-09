# Healthcare Deals Canada

Healthcare Deals Canada is a static Astro site for current promotions aimed at healthcare professionals in Canada. It publishes only curated offers found on official Canadian source pages and refreshes the tracked data every week through GitHub Actions.

## Stack

- Astro + TypeScript
- Static deployment on Cloudflare Pages
- Deterministic source extraction with Cheerio + Zod
- Vitest fixture coverage for extractors and status transitions

## Local development

```bash
uv venv .venv
source .venv/bin/activate
npm install
npm run update:promotions
npm run dev
```

Useful commands:

- `npm run update:promotions:dry` runs the refresh without changing tracked data.
- `npm test` runs fixture and status tests.
- `npm run build` generates the static site in `dist/`.
- `npm run preview:pages` previews the built site through Wrangler’s Pages emulator.

## Data layout

- `config/sources.ts` contains the smaller active parser registry used by the weekly updater.
- `config/source-catalog.ts` contains the broader curated backlog of official Canadian source pages to onboard next.
- `scripts/lib/updater.ts` fetches, validates, normalizes, and writes generated outputs.
- `src/data/promotions.generated.json` is the tracked public data file used by the site.
- `reports/discovery.generated.json` stores newly discovered official-domain candidates that are not yet public.

## Publishing model

Cloudflare Pages should be connected to the GitHub repository with:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The weekly workflow in `.github/workflows/refresh-promotions.yml` runs every Monday at 13:00 UTC and on manual dispatch. It:

1. Refreshes curated sources.
2. Blocks publication if fewer than 75% of sources validate or if active offers collapse unexpectedly.
3. Runs tests and a production build.
4. Commits generated data back to `main`, which triggers a Cloudflare Pages redeploy through Git integration.

## Notes

- v1 is English-only.
- Outbound links go directly to official provider pages.
- The site is intentionally curated, not an open-web promotions crawler.
