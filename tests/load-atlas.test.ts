import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAtlas } from '../lib/load-atlas';
const payload={featuredPath:null,themes:[],nodes:[],edges:[],sources:[],signals:[],events:[],sourceStatus:[]};
test('research refresh loads uncached graph data',async()=>{
 const request:typeof fetch=async(_,options)=>{assert.equal(options?.cache,'no-store');assert.ok(options?.signal);return Response.json(payload);};
 assert.deepEqual(await loadAtlas(request),payload);
});
test('a stalled research request times out instead of loading forever',async()=>{
 const request:typeof fetch=(_,options)=>new Promise((_,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
 await assert.rejects(loadAtlas(request,10),/timed out/);
});
test('research refresh reports database errors and rejects malformed data',async()=>{
 await assert.rejects(loadAtlas(async()=>new Response(null,{status:503})),/HTTP 503/);
 await assert.rejects(loadAtlas(async()=>Response.json({error:'not a graph'})),/invalid research data/);
});
