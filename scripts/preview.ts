import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { atlas, db } from '../lib/db';
import type { Source } from '../lib/types';

async function main(){
 const snapshot=atlas();
 snapshot.sourceStatus=[{name:'Portable browser preview',status:'offline snapshot',lastRun:null,error:'Explore the bundled research without a server. This file does not ingest new sources or accept editorial writes.'}];
 const nodeSources:Record<string,Source[]>={};
 for(const row of db().prepare('SELECT ns.node_id,s.data FROM node_sources ns JOIN sources s ON s.id=ns.source_id').all()){
  (nodeSources[String(row.node_id)]??=[]).push(JSON.parse(String(row.data)));
 }
 const result=await build({entryPoints:['preview/entry.tsx'],absWorkingDir:process.cwd(),bundle:true,write:false,outdir:'artifacts/bundle',minify:true,platform:'browser',target:['safari15','chrome100','firefox100'],jsx:'automatic',alias:{'next/link':resolve('preview/Link.tsx')},define:{'process.env.NODE_ENV':'"production"',__ATLAS_SNAPSHOT__:JSON.stringify({atlas:snapshot,nodeSources})}});
 const js=result.outputFiles.find(f=>f.path.endsWith('.js'))!.text.replace(/<\/script/gi,'<\\/script');
 const css=result.outputFiles.find(f=>f.path.endsWith('.css'))!.text;
 const font=(family:string,name:string)=>`@font-face{font-family:'${family}';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${readFileSync(resolve(name)).toString('base64')}) format('woff2')}`;
 const fonts=font('DM Sans','node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2')+font('Libre Caslon Display','node_modules/@fontsource/libre-caslon-display/files/libre-caslon-display-latin-400-normal.woff2');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><title>The Consumer Atlas — Interactive Preview</title><style>${fonts}\n${css}</style></head><body><div id="root"></div><noscript>Enable JavaScript to explore this interactive research preview.</noscript><script>${js}</script></body></html>`;
 const destination=resolve(process.argv[2]||'artifacts/consumer-atlas-preview.html');mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,html);console.log(`Portable preview: ${destination} (${Math.round(Buffer.byteLength(html)/1024)} KB). No server required.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
