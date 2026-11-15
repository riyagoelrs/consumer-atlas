# Cloud setup and startup

Use the existing isolated checkout at `/workspace/consumer-atlas`. Do not create a Git worktree unless the user explicitly requests one.

## Retained files

Node 24 is installed. Dependencies are in `node_modules`, a frozen npm lockfile is present, and npm uses the writable `/workspace/.npm-cache`. `.data/atlas.sqlite` is the persistent local research database. `.env.local` is ignored and contains independently generated admin/cron tokens; preserve it, never print it in logs or commit it.

## Reproduce setup

```sh
cd /workspace/consumer-atlas
bash scripts/setup.sh
```

The script runs frozen installation, initializes the database without replacing editorial work, creates credentials only when no local environment file exists, and validates a production build.

## Start in a new task

```sh
cd /workspace/consumer-atlas
npm run dev
```

Verify `GET /api/health` returns `status: ok` and `GET /api/atlas` contains 11 themes and at least 26 entities. Use local HTTP requests for onboarding validation; do not create unsupported localhost preview links.

For scheduled feed updates, start `npm run worker` as a separate supervised process **after** network access to the feed is enabled. It runs every 30 minutes and records failures without replacing research. Processes must be restarted after snapshot restoration. For production start, use `npm run build` then `npm start`.

## Validate

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run ingest
```

The first four commands validate local development independently of feed access. The last requires `www.theguardian.com` outbound access and is currently blocked by policy (403). Chromium is installed at `/usr/bin/chromium`. Browser tests use a separate database and port 3001.

## Configuration persistence

The environment configuration read tool returned “The current environment draft could not be verified.” The subsequent additive network draft proposal failed with “saving the draft could not be confirmed.” Therefore no reusable configuration save or publication is claimed. These instructions and `scripts/setup.sh` are the fallback artifacts. Add only necessary domains in environment settings, preserve other rules, retry the live feed, and save/publish the environment through the product after setup review.
