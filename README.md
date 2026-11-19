# The Consumer Atlas

An editorial research atlas of how culture connects to consumer behavior and commerce. The empty repository was initialized with a working Next.js application, not a static mockup.

## Run locally

Requires **Node.js 24+** (uses built-in `node:sqlite`), npm, and writable storage. In this cloud checkout:

```sh
cd /workspace/consumer-atlas
bash scripts/setup.sh
npm run dev
```

The setup script uses `npm ci`, seeds idempotently, builds, and creates independent random local admin and cron tokens **only if `.env.local` does not already exist**. It preserves existing configuration. Outside this cloud environment, replace the absolute checkout and npm cache paths in the script, or run:

```sh
npm ci
cp .env.example .env.local
# Set ADMIN_TOKEN and CRON_SECRET to separate random strings of at least 32 characters.
npm run db:seed
npm run dev
```

Open the development server on port 3000 using your environment's supported access mechanism. `/api/health` checks the database. The admin area is `/admin`; sign in using your private `ADMIN_TOKEN` from `.env.local`. A local token is configured in this instance; its value is not printed or committed. Tokens stay in browser memory and are cleared on sign-out/reload. This is a single-editor access model, not a multi-user authentication service.

## What works

The cartographic edition uses original SVG engraving, irregular thematic provinces, a conceptual index grid, rhumb lines, a compass rose, an alphabetical gazetteer, and parchment-style typography and colour. Design notes reference Ortelius, Mercator, the David Rumsey Map Collection and Library of Congress maps; no archival map image is copied. The grid is an index of ideas, not geographic coordinates. Brand and platform nodes have primary destinations attached, all marked unchecked until independently reviewed.

- D3 pan/zoom universe with **11 themes**, **119 entities**, and **219 semantic relationships**. Stable SVG layouts, keyboard-operable nodes/edges, reduced-motion support, mobile layout, thematic drilldown, global/alias search, breadcrumbs, and reset.
- Clickable node dossiers and relationship explanations, status/confidence distinctions, connected entity navigation, investor research questions, source cards and on-demand official embed players.
- Evidence-weighted Dijkstra research paths in either traversal direction; the UI explicitly does not present these as causal chains. Search Balletcore → Consumer packaged goods to explore the reference path.
- Entity/relationship creation and editing, evidence submission and attachment to multiple nodes/edges, review decisions, ingestion job history, stored editorial watchlists, and persistent featured research path curation.
- Normalized durable SQLite schema, transactional writes, foreign keys, source URL deduplication, indexes, idempotent seed. Research survives server restart. Saved explorer views intentionally use per-browser local storage.
- Guardian Life & style RSS adapter: metadata normalization, canonical URL deduplication, updates, bounded retry, failed-job records, deterministic candidate matching and editorial review. Headlines can publish as observed source items; entity associations require approval. When two known entities co-occur in a headline, a research hypothesis is suggested in the review card. It remains unpublished unless an editor explicitly selects it, reviews its explanation, and approves both entity attachments. Feed reviews cannot create verified claims or overwrite existing edges.
- New Signals distinguishes initial seed collection, editorial additions, and feed discoveries. Date filters use ingestion/addition time; original publication dates appear separately when provided. The browser polls approved public data every 30 seconds.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server, port 3000 |
| `npm run build` | Production build and TypeScript validation |
| `npm start` | Production server, port 3000 |
| `npm run typecheck` | Standalone TypeScript check |
| `npm test` | Graph, evidence, API, database and ingestion tests; isolated temp databases |
| `npm run test:e2e` | Chromium desktop/mobile/admin tests; production build required; isolated port 3001/database |
| `npm run db:seed` | Apply schema and seed missing initial collection |
| `npm run ingest` | One publisher feed job; nonzero exit on failure |
| `npm run worker` | Run publisher feed job now and every 30 minutes |

Browser tests use `/usr/bin/chromium`, overridable with `CHROMIUM_PATH`. They never add fixture records to the main research database. Test-only example.com records are confined to isolated databases.

## Open a portable browser preview

A ready-to-open export is checked in at [preview/consumer-atlas-preview.html](preview/consumer-atlas-preview.html). On GitHub, use **Download raw file**, then open the downloaded HTML in your browser. Rebuild this distributable with `npm run preview:build -- preview/consumer-atlas-preview.html` after public research changes.

Run `npm run preview:build` to export public research into `artifacts/consumer-atlas-preview.html`. Open that HTML file directly in a modern browser. The single file embeds its React/D3 code, CSS, fonts, and source data; no npm process or backend is needed to explore it. Search, pan/zoom, theme drilldown, node/edge panels, pathfinding, filters, Investor Lens and browser-local saved views remain interactive. It is explicitly labeled an offline research snapshot; live ingestion and admin writes require the full app. External source links and manually loaded third-party embeds still require Internet access.

Run `npm run preview:test` to rebuild and verify the standalone document with network access disabled. Managed cloud Chrome blocks `file:` navigation, so this check loads the unchanged HTML through an intercepted local document URL; it verifies there are no backend or external asset requests. Direct file opening in Safari must be checked on the user's machine. The generated HTML contains only the public atlas and attached public evidence, not credentials, editorial queues or watchlists. Review research content before sharing an export.

## Architecture

```
D3 SVG explorer / editorial React client
             ↓ same-origin HTTP
Next.js App Router APIs (Node runtime)
             ↓
lib/db.ts → normalized SQLite / WAL / parameterized transactions
             ↑
RSS adapter → observed sources + signals → editorial queue → source attachments
Manual links → canonical source objects → node and edge evidence
```

`lib/expanded-research.ts` adds the second-survey catalogue: 93 additional concepts, brands and platforms, 187 editorial connections and 52 reference destinations. All added associations are interpretations; no quantitative market, funding or health claim is synthesized. A versioned, additive catalogue upgrade preserves existing editorial records and detects source URL duplicates. `lib/seed.ts` is server-side seed data, not a graph hardcoded inside the visualization. `GET /api/atlas` reads persistent state; node evidence is lazy-loaded separately. The opening page reads the graph on the server and includes it in the initial HTML, so it does not depend on a browser fetch to leave a loading screen. Background refreshes have a 15-second timeout, retain the displayed graph on failure, and expose a retry action. Database initialization failures show an actionable startup error. `lib/graph.ts` contains pure pathfinding and search. `lib/evidence.ts` canonicalizes public URLs and derives fixed-provider official embed URLs. `migrations/001_init.sql` defines themes, nodes, memberships, edges, evidence, sources, social posts, signals, node events, jobs, reviews, saved views, watchlists and metadata. Current migrations are applied idempotently on database open. Introduce ordered migration versions before making destructive schema changes.

### API

- `GET /api/atlas`: public graph, sources, signals and source status; no secret or editorial queue data.
- `GET /api/nodes/:id`: attached node evidence.
- `GET /api/health`: storage readiness.
- `GET /api/admin`: protected queue, job history and watchlists.
- `POST /api/admin`: protected actions `node`, `edge`, `evidence`, `review`, `watchlist`, `featuredPath`.
- `POST /api/ingest`: admin or cron bearer token.
- `GET /api/ingest`: cron bearer token, suitable for a scheduler.

Writes fail closed when `ADMIN_TOKEN` is missing/short. All writes are server-validated and transactional. Verified relationships require evidence references. Same-origin checks supplement explicit bearer authentication. Public input is never rendered as HTML. Tokens are never included in client bundles. The server only fetches a fixed RSS destination; submitted source URLs are stored as links and are **not fetched**, avoiding an arbitrary-URL ingestion/SSRF surface. Embeds use exact host/path allowlists, sandboxed iframes and a persistent original-link fallback. Third parties can still set cookies when a user explicitly loads an embed.

## Sources, dates and honest limitations

The seed provides reference destinations: Ballerina Farm's official store/profile, Nara Smith's public profile, and reference articles. Profiles are **not specific post embeds**. No social post IDs, engagement metrics, quotations, revenue figures, funding events or commercial partnerships were invented. Post embeds become available when an editor submits a genuine public post URL. Official X, Instagram/Reel and TikTok players are implemented, but end-to-end access to those providers has not been verified in this cloud policy. Deleted/private/blocked content retains the original source card/link.

Most seed connections are explicitly **editorial interpretations**. The source-backed Ballerina Farm storefront/food relationship is a limited product-catalogue statement, not proof of sales, direct influence or ideology. Source destination availability is marked unchecked. The seed's 2026-11-10 date is an editorial collection date, not a claimed historical launch date. Public discussion of “tradwife” is not treated as a creator's self-identification. Confidence scores are curatorial assessments, not probabilities.

**Current cloud network blocker:** live requests to `www.theguardian.com` and `ballerinafarm.com` were denied by the outbound proxy (403). The actual RSS job was attempted and recorded as failed. RSS parsing, deduplication, review behavior and failure handling pass tests, but **successful live RSS ingestion has not been validated**. Add `www.theguardian.com` in environment Internet settings, then retry `npm run ingest`. Reference checks/embeds may additionally need `ballerinafarm.com`, `en.wikipedia.org`, `www.instagram.com`, `www.tiktok.com`, `platform.twitter.com` and their provider-required assets. Do not replace an unknown allowlist. Self-hosted fonts need no Google Fonts access.

Social discovery/search APIs, external news APIs, AI classification and Supabase Realtime are **not connected**. There is no fake live integration or AI output. `IngestionAdapter` is the extension boundary; current matching is deterministic and manual review remains required. Watchlists record research interests; they do not activate unauthorized social monitoring. Live changes use polling. Provider discovery access, quotas and terms must be configured separately from embeds.

## Scheduling and deployment

### GitHub Pages: browser-viewable research atlas

The reviewed interactive preview is published as a static site from `docs/index.html`. Enable it once in [repository Settings → Pages](https://github.com/riyagoelrs/consumer-atlas/settings/pages): choose **Deploy from a branch**, branch **main**, folder **/docs**, then **Save**. GitHub will build the site; the expected project address is `https://riyagoelrs.github.io/consumer-atlas/`. This address is not a verified deployment until GitHub reports success and the page responds.

This static edition includes the complete interactive atlas and research snapshot, search, pathfinding, source dossiers, and browser-local saved views. Database writes and live ingestion require the Node application. No server process or build command runs on GitHub Pages; all assets and public data are embedded in the HTML. `.nojekyll` prevents extra processing. `docs/version.json` records the source revision and content hash.

After editing the research or UI, rebuild the reviewed export and Pages copy, then commit both:

```sh
npm run preview:build -- preview/consumer-atlas-preview.html
npm run pages:build
node --import tsx scripts/check-preview.ts docs/index.html
```

### Working deployment target: persistent Node server

Use a Node 24 host with one durable writable volume. This implementation uses SQLite; run one application instance against that volume. Do not place the database on an ephemeral filesystem or share SQLite files over an unsupported network filesystem.

```sh
npm ci
# Securely inject ADMIN_TOKEN, CRON_SECRET and an absolute ATLAS_DB_PATH on your durable volume.
npm run db:seed
npm run build
npm start
# Separate supervised process for automated ingestion:
npm run worker
```

Use your platform's process supervisor for both services and HTTPS ingress. Back up using SQLite's backup API while writes are active (not a raw main-file copy that ignores WAL). To export in Node:

```js
const { DatabaseSync, backup } = require('node:sqlite');
const database = new DatabaseSync(process.env.ATLAS_DB_PATH);
await backup(database, '/durable-backups/atlas.sqlite');
```

Restore a backup to `ATLAS_DB_PATH` while services are stopped. Keep tokens outside backups intended for sharing. Scheduled jobs and browser polling do not survive stopped processes: restart the server and worker in new environments.

### Vercel / Supabase boundary

The Next.js UI and routes compile for Node deployment, and `vercel.json` supplies a daily 08:00 UTC cron declaration (Vercel supplies `Authorization: Bearer <CRON_SECRET>`). **Do not deploy this SQLite write backend directly to Vercel:** serverless filesystems do not provide durable shared writes. A Supabase/PostgreSQL repository adapter, migrations/RLS and authenticated multi-user authorization are additional implementation work before that deployment is supported. No Supabase credentials are required or requested for the working local/single-server version. The project does not claim Vercel persistence, Supabase integration or a published deployment.

## Validation and cloud reuse

Production build, unit/API/ingestion tests and browser workflows are exercised during implementation. See `ENVIRONMENT.md` for cloud setup commands and remaining configuration persistence issues. Use the existing isolated checkout; do not create a Git worktree unless explicitly requested.
