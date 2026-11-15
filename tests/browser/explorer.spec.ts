import { test,expect } from '@playwright/test';
test('universe, search, relationship navigation, pathfinding and saved views',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{name:'A living map of culture & commerce.'})).toBeVisible();await expect(page.getByRole('button',{name:'Explore Fashion & Aesthetics',exact:true})).toBeVisible();await page.screenshot({path:'test-results/universe-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Explore Fashion & Aesthetics',exact:true}).click();await expect(page.getByLabel('Interactive knowledge network')).toBeVisible();
 await page.getByRole('textbox',{name:'Search all entities'}).fill('Hannah');await page.locator('.search-results button').first().click();await expect(page.locator('.editorial-panel h2')).toHaveText('Ballerina Farm / Hannah Neeleman');
 await page.locator('.connection-why').filter({hasText:'Commercializes'}).click();await expect(page.getByText('WHY ARE THESE CONNECTED?',{exact:true})).toBeVisible();await expect(page.getByText('verified',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Find a connection'}).click();await page.getByRole('button',{name:'Trace the path'}).click();await expect(page.locator('.path-step')).toHaveCount(5);await expect(page.locator('.graph-edge.active').first()).toBeVisible();
 await page.getByRole('button',{name:'Investor lens'}).click();await expect(page.getByRole('button',{name:'Investor lens'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Saved views'}).click();await page.getByRole('button',{name:'Save current view'}).click();await expect(page.locator('.saved-row').first()).toBeVisible();expect(errors).toEqual([]);
});
test('mobile exploration is usable without horizontal overflow',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.atlas-svg')).toBeVisible();await page.getByRole('button',{name:'Toggle filters'}).click();await expect(page.locator('.filters')).toBeVisible();await page.getByRole('button',{name:'Toggle filters'}).click();await page.getByRole('button',{name:'Explore this connection'}).click();await expect(page.getByRole('button',{name:'Trace the path'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'test-results/universe-mobile.png',fullPage:true});});
test('editorial access and entity/evidence writes work end to end',async({page,request})=>{expect((await request.post('/api/admin',{data:{action:'node',data:{}}})).status()).toBe(401);await page.goto('/admin');await page.getByLabel('ADMIN ACCESS TOKEN').fill(process.env.ADMIN_TOKEN||'');await page.getByRole('button',{name:'Open the editorial desk'}).click();await expect(page.getByRole('heading',{name:'Create or edit an entity.'})).toBeVisible();await page.getByLabel('Name',{exact:true}).fill('Browser test research entity');await page.getByLabel('Summary',{exact:true}).fill('A browser validation record in an isolated test database.');await page.getByLabel('Cultural significance').fill('Test context');await page.getByLabel('Commercial relevance / research questions').fill('Test context');await page.getByRole('button',{name:'Save entity'}).click();await expect(page.getByRole('status')).toHaveText('Saved to the research database.');await page.getByRole('button',{name:'Evidence',exact:true}).click();await page.getByLabel('Public URL').fill('https://example.com/browser-test');await page.getByLabel('Source title').fill('Browser test evidence');await page.getByLabel('Editorial annotation').fill('Explicit test fixture; not real research.');await page.getByLabel('Browser test research entity',{exact:true}).check();await page.getByRole('button',{name:'Save supporting source'}).click();await expect(page.getByRole('status')).toHaveText('Saved to the research database.');const a=await(await request.get('/api/atlas')).json();expect(a.sources.some((s:{title:string})=>s.title==='Browser test evidence')).toBe(true);});
test('editors can curate a persistent featured journey',async({page})=>{
 await page.goto('/admin');await page.getByLabel('ADMIN ACCESS TOKEN').fill(process.env.ADMIN_TOKEN||'');await page.getByRole('button',{name:'Open the editorial desk'}).click();await page.getByRole('button',{name:'Featured path',exact:true}).click();await page.getByLabel('Story title').fill('A curated browser test journey');await page.getByLabel('Editorial introduction').fill('A test route from culture to commerce.');await page.getByRole('button',{name:'Publish featured path'}).click();await expect(page.getByRole('status')).toHaveText('Saved to the research database.');await page.goto('/');await expect(page.locator('.editorial-panel h2')).toHaveText('A curated browser test journey');await page.getByRole('button',{name:'Explore this connection'}).click();await expect(page.locator('.path-step')).toHaveCount(5);
});
test('the initial graph renders even when the browser cannot execute JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await page.goto('/');
 await expect(page.getByRole('heading',{name:'A living map of culture & commerce.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Explore Fashion & Aesthetics',exact:true})).toBeVisible();
 await expect(page.getByText('Opening the research universe…')).toHaveCount(0);await context.close();
});
test('failed browser refresh retains the server-rendered graph and supports retry',async({page})=>{
 await page.route('**/api/atlas',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'test database failure'})}));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'A living map of culture & commerce.'})).toBeVisible();
 await expect(page.locator('.error-banner')).toBeVisible();
 await page.unroute('**/api/atlas');await page.locator('.error-banner').getByRole('button',{name:'Retry'}).click();
 await expect(page.locator('.error-banner')).toHaveCount(0);
 await page.getByRole('button',{name:'Explore Fashion & Aesthetics',exact:true}).click();
 await expect(page.getByLabel('Interactive knowledge network')).toBeVisible();
});
