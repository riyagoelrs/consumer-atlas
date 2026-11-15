import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const testDatabase=join(mkdtempSync(join(tmpdir(),'atlas-browser-')),'atlas.sqlite');
export default defineConfig({testDir:'./tests/browser',fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:3001',headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']},trace:'retain-on-failure'},webServer:{command:'npm run start -- --port 3001',url:'http://127.0.0.1:3001/api/health',reuseExistingServer:false,timeout:60000,env:{ATLAS_DB_PATH:testDatabase}},reporter:'list'});
