import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
process.env.ATLAS_DB_PATH=join(mkdtempSync(join(tmpdir(),'atlas-catalogue-')),'catalogue.sqlite');
import { atlas, db, saveNode } from '../lib/db';
import { nodes,edges,sources,themes } from '../lib/seed';
import { mapPositions } from '../lib/layout';
test('the second survey expands every province with real reference destinations',()=>{
 assert.ok(nodes.length>=110);assert.ok(edges.length>=200);assert.ok(sources.length>=50);
 assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);assert.equal(new Set(edges.map(e=>e.id)).size,edges.length);assert.equal(new Set(sources.map(s=>s.url)).size,sources.length);
 for(const theme of themes)assert.ok(nodes.filter(n=>n.themes.includes(theme.id)).length>=8,theme.name);
 const nodeIds=new Set(nodes.map(n=>n.id)),sourceIds=new Set(sources.map(s=>s.id));for(const edge of edges){assert.ok(nodeIds.has(edge.source));assert.ok(nodeIds.has(edge.target));for(const id of edge.evidence)assert.ok(sourceIds.has(id));}
});
test('catalogue upgrades preserve editorial changes and remain repeatable',()=>{
 const data=atlas(),n=data.nodes.find(n=>n.id==='graza')!;saveNode({...n,description:'An existing editor’s revised description.'});
 const count=data.nodes.length,edgeCount=data.edges.length;
 db().prepare("DELETE FROM metadata WHERE key='catalogue-v2'").run();
 execFileSync(process.execPath,['--import','tsx','scripts/seed.ts'],{cwd:process.cwd(),env:process.env,stdio:'pipe'});
 const current=atlas();assert.equal(current.nodes.length,count);assert.equal(current.edges.length,edgeCount);assert.equal(current.nodes.find(n=>n.id==='graza')?.description,'An existing editor’s revised description.');
 assert.equal(db().prepare("SELECT COUNT(*) AS count FROM signals WHERE id='catalogue-v2'").get()?.count,1);
});
test('map coordinates are deterministic and spread dense node labels',()=>{
 const data=atlas(),visible=new Set(data.nodes.map(n=>n.id));
 for(const universe of [true,false]){const a=mapPositions(data,universe,visible),b=mapPositions(data,universe,visible);assert.deepEqual(a,b);assert.equal(a.size,data.nodes.length);assert.equal(new Set([...a.values()].map(p=>`${p.x},${p.y}`)).size,data.nodes.length);}
});
