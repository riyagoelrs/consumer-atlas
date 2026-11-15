#!/usr/bin/env bash
set -euo pipefail
cd /workspace/consumer-atlas
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
node <<'JS'
const fs = require('node:fs');
const crypto = require('node:crypto');
if (!fs.existsSync('.env.local')) {
  fs.writeFileSync('.env.local', `ADMIN_TOKEN=${crypto.randomBytes(32).toString('hex')}\nCRON_SECRET=${crypto.randomBytes(32).toString('hex')}\n`, {mode:0o600});
}
JS
npm run db:seed
npm run build
