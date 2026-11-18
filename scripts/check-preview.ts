import { chromium, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1050}});
  const page=await context.newPage();const errors:string[]=[],network:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.isNavigationRequest())network.push(r.url());});
  // Managed Chrome blocks file: navigation. Serve the unchanged document through an intercepted local navigation; every other network request stays offline.
  const html=readFileSync(resolve(process.argv[2]||'artifacts/consumer-atlas-preview.html'),'utf8');
  await page.route('http://127.0.0.1:3000/portable-preview-check',route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto('http://127.0.0.1:3000/portable-preview-check');
  await expect(page.getByRole('heading',{name:'A living map of culture & commerce.'})).toBeVisible();
  await expect(page.locator('.preview-notice')).toBeVisible();
  await page.getByRole('button',{name:'Explore Fashion & Aesthetics',exact:true}).click();
  await expect(page.getByLabel('Interactive knowledge network')).toBeVisible();
  await page.getByLabel('Search all entities').fill('Hannah');await page.locator('.search-results button').first().click();
  await expect(page.locator('.editorial-panel h2')).toHaveText('Ballerina Farm / Hannah Neeleman');
  await expect(page.locator('.evidence').first()).toBeVisible();
  await page.getByRole('button',{name:'Find a connection'}).click();await page.getByRole('button',{name:'Trace the path'}).click();
  await expect(page.locator('.path-step')).toHaveCount(5);
  await page.getByRole('button',{name:'Investor lens'}).click();await expect(page.getByRole('button',{name:'Investor lens'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Saved views'}).click();await page.getByRole('button',{name:'Save current view'}).click();await expect(page.locator('.saved-row').first()).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Saved views'}).click();await expect(page.locator('.saved-row').first()).toBeVisible();
  await page.getByRole('button',{name:'The Consumer Atlas home'}).click();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);expect(network).toEqual([]);
  console.log('PASS: self-contained document loads offline; themes, search, evidence, pathfinding, investor lens, saved views, and mobile layout work with zero network requests.');
  await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
