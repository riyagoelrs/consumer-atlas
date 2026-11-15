import Parser from 'rss-parser';
import { request, EnvHttpProxyAgent } from 'undici';
import { createHash, randomUUID } from 'node:crypto';
import { atlas, db, saveSource, transaction } from './db';
import { normalizeUrl } from './evidence';
import type { Source } from './types';
export type FeedItem={title:string;url:string;published:string|null};
export interface IngestionAdapter {name:string;discover:()=>Promise<FeedItem[]>}
export function parseFeed(xml:string):Promise<FeedItem[]>{return new Parser().parseString(xml).then(feed=>feed.items.filter(i=>i.title&&i.link).map(i=>({title:i.title!,url:i.link!,published:i.isoDate&&Number.isFinite(Date.parse(i.isoDate))?new Date(i.isoDate).toISOString():null})));}
export const guardianAdapter:IngestionAdapter={name:'guardian-life-style',async discover(){
 const response=await request('https://www.theguardian.com/lifeandstyle/rss',{dispatcher:new EnvHttpProxyAgent(),headers:{'user-agent':'ConsumerAtlas/0.1 (+editorial research RSS reader)'},headersTimeout:20000,bodyTimeout:20000});
 if(response.statusCode!==200){await response.body.dump();throw new Error(`Guardian RSS returned HTTP ${response.statusCode}. Check the environment domain policy and source availability.`);}
 const xml=await response.body.text();if(xml.length>4_000_000)throw new Error('Feed exceeds size limit');return parseFeed(xml);
}};
export function ingestItems(items:FeedItem[],adapter:string){
 return transaction(()=>{
 const d=db(),nodes=atlas().nodes;let added=0,updated=0;
 for(const item of items.slice(0,100)){
  let url:string;try{url=normalizeUrl(item.url);}catch{continue;}
  // The fixed Guardian adapter may only emit Guardian article URLs.
  if(adapter==='guardian-life-style'&&new URL(url).hostname!=='www.theguardian.com')continue;
  const id=createHash('sha256').update(url).digest('hex').slice(0,24);const existing=d.prepare('SELECT data FROM sources WHERE url=?').get(url);
  if(existing){const source=JSON.parse(existing.data as string) as Source;if(source.title!==item.title){source.title=item.title;d.prepare('UPDATE sources SET data=? WHERE url=?').run(JSON.stringify(source),url);updated++;}continue;}
  const source:Source={id,title:item.title.slice(0,500),url,publisher:adapter==='guardian-life-style'?'The Guardian':adapter,platform:'article',published:item.published,annotation:'Discovered through a publisher feed. A headline is an observed source item; thematic relevance awaits editorial review.',available:'feed-observed'};saveSource(source,d);
  const now=new Date().toISOString();d.prepare('INSERT INTO signals VALUES(?,NULL,?,?,?,?,?)').run(`signal-${id}`,id,source.title,'feed',now,item.published);
  const q=item.title.toLowerCase();const matches=nodes.filter(n=>[n.name,...n.aliases].some(alias=>alias.length>3&&q.includes(alias.toLowerCase())));
  d.prepare('INSERT INTO editorial_reviews VALUES(?,?,?,?,?,NULL)').run(randomUUID(),'source',JSON.stringify({sourceId:id,nodeIds:matches.map(n=>n.id),suggestedConnection:matches.length>=2?{source:matches[0].id,target:matches[1].id,type:'Associated with',status:'hypothesis',confidence:.45,explanation:'These entities co-occur in a publisher headline. This is a research lead, not evidence of influence or collaboration.'}:null,explanation:'Deterministic title matching suggests these entities. An editor must verify relevance before attachment.'}),'pending',now);
  added++;
 }
 return {added,updated};
 });
}
export async function runIngestion(adapter=guardianAdapter){
 const d=db(),id=randomUUID(),now=new Date().toISOString();
 const locked=transaction(()=>{const active=d.prepare("SELECT id FROM ingestion_jobs WHERE status='running' AND started_at > ?").get(new Date(Date.now()-10*60*1000).toISOString());if(active)return true;d.prepare('INSERT INTO ingestion_jobs VALUES(?,?,?,0,?,NULL,NULL)').run(id,adapter.name,'running',now);return false;});
 if(locked)throw new Error('An ingestion job is already running.');
 let error:unknown;
 for(let attempt=1;attempt<=3;attempt++){
  d.prepare('UPDATE ingestion_jobs SET attempts=? WHERE id=?').run(attempt,id);
  try{const result=ingestItems(await adapter.discover(),adapter.name);d.prepare("UPDATE ingestion_jobs SET status='completed',finished_at=? WHERE id=?").run(new Date().toISOString(),id);return {id,...result};}
  catch(e){error=e;if(/HTTP (401|403|404)/.test(String(e)))break;if(attempt<3)await new Promise(r=>setTimeout(r,attempt*1000));}
 }
 const message=error instanceof Error?error.message:'Ingestion failed';d.prepare("UPDATE ingestion_jobs SET status='failed',finished_at=?,error=? WHERE id=?").run(new Date().toISOString(),message.slice(0,1000),id);throw new Error(message);
}
