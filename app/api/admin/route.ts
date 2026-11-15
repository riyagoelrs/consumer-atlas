import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authorized, checkOrigin } from '@/lib/auth';
import { atlas, db, saveEdge, saveNode, saveSource, transaction } from '@/lib/db';
import { findPath } from '@/lib/graph';
import { socialTarget } from '@/lib/evidence';
const id=z.string().regex(/^[\w-]{1,100}$/);
const text=z.string().trim().min(1).max(5000);
const nodeSchema=z.object({id:id.optional(),name:text,type:text,description:text,cultural:text,commercial:text,themes:z.array(id).min(1),aliases:z.array(z.string().max(100)).default([])});
const edgeSchema=z.object({id:id.optional(),source:id,target:id,type:text,explanation:text,status:z.enum(['verified','interpretation','hypothesis']),confidence:z.number().min(0).max(1),evidence:z.array(id).default([]),bidirectional:z.boolean().default(false)});
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(req:Request){if(!authorized(req))return Response.json({error:'Unauthorized'},{status:401});const d=db();return Response.json({reviews:d.prepare('SELECT * FROM editorial_reviews ORDER BY created_at DESC LIMIT 100').all(),jobs:d.prepare('SELECT * FROM ingestion_jobs ORDER BY started_at DESC LIMIT 20').all(),watchlists:d.prepare('SELECT * FROM watchlists').all(),savedViews:d.prepare('SELECT * FROM saved_views').all()});}
export async function POST(req:Request){
 if(!checkOrigin(req)||!authorized(req))return Response.json({error:'Unauthorized'},{status:401});
 if(Number(req.headers.get('content-length')||0)>64000)return Response.json({error:'Request too large'},{status:413});
 try{const raw=await req.text();if(raw.length>64000)throw new Error('Request too large');const body=JSON.parse(raw),d=db(),now=new Date().toISOString();
 return transaction(()=>{
  if(body.action==='node'){
   const n=nodeSchema.parse(body.data);if(n.themes.some(t=>!d.prepare('SELECT id FROM themes WHERE id=?').get(t)))throw new Error('Unknown theme');
   const records=atlas().nodes;const old=records.find(x=>x.id===n.id);const angle=records.length*2.399;const value={...n,id:n.id||randomUUID(),status:old?.status||'interpretation' as const,updated:now,x:old?.x??Math.cos(angle)*300,y:old?.y??Math.sin(angle)*275};saveNode(value);return Response.json({id:value.id});
  }
  if(body.action==='edge'){
   const e=edgeSchema.parse(body.data);if(e.source===e.target)throw new Error('Choose different entities');if(e.status==='verified'&&!e.evidence.length)throw new Error('Verified relationships need supporting evidence');
   const value={...e,id:e.id||randomUUID(),reviewed:now};saveEdge(value);return Response.json({id:value.id});
  }
  if(body.action==='evidence'){
   const data=z.object({url:z.url(),title:text,nodeIds:z.array(id).default([]),edgeIds:z.array(id).default([]),annotation:text}).parse(body.data);const target=socialTarget(data.url);
   let sourceId=d.prepare('SELECT id FROM sources WHERE url=?').get(target.url)?.id as string|undefined;
   if(!sourceId){sourceId=randomUUID();saveSource({id:sourceId,title:data.title,url:target.url,publisher:new URL(target.url).hostname,platform:target.platform,published:null,annotation:data.annotation,available:'submitted-unchecked'});if(target.embed)d.prepare('INSERT INTO social_posts VALUES(?,?,?,?)').run(sourceId,target.platform,target.externalId,now);}
   for(const nodeId of data.nodeIds)d.prepare('INSERT OR IGNORE INTO node_sources VALUES(?,?)').run(nodeId,sourceId);
   for(const edgeId of data.edgeIds){const row=d.prepare('SELECT data FROM edges WHERE id=?').get(edgeId);if(!row)throw new Error('Unknown relationship');const e=JSON.parse(row.data as string);e.evidence=[...new Set([...e.evidence,sourceId])];e.reviewed=now;saveEdge(e);}
   d.prepare('INSERT INTO signals VALUES(?,?,?,?,?,?,NULL)').run(randomUUID(),data.nodeIds[0]||null,sourceId,`Editorial source added: ${data.title}`,'manual',now);return Response.json({id:sourceId});
  }
  if(body.action==='review'){
   const input=z.object({id,decision:z.enum(['approved','rejected']),nodeIds:z.array(id).default([]),connection:edgeSchema.optional()}).parse(body.data);const row=d.prepare("SELECT * FROM editorial_reviews WHERE id=? AND status='pending'").get(input.id);if(!row)throw new Error('Pending review not found');
   const p=JSON.parse(row.payload as string);if(input.decision==='approved'&&row.kind==='source'){for(const nodeId of input.nodeIds){d.prepare('INSERT OR IGNORE INTO node_sources VALUES(?,?)').run(nodeId,p.sourceId);d.prepare('INSERT INTO node_events VALUES(?,?,?,?,?)').run(randomUUID(),nodeId,'Source attached after editorial review',now,p.sourceId);}}
   if(input.decision==='approved'&&input.connection){
    const c=input.connection;
    if(row.kind!=='source'||!input.nodeIds.includes(c.source)||!input.nodeIds.includes(c.target)||c.source===c.target)throw new Error('Review both endpoint attachments before publishing a connection');
    if(c.id||c.status==='verified')throw new Error('Feed suggestions may only create interpretations or hypotheses');
    saveEdge({...c,id:randomUUID(),evidence:[p.sourceId],reviewed:now});
    d.prepare('INSERT INTO signals VALUES(?,?,?,?,?,?,NULL)').run(randomUUID(),c.source,p.sourceId,'Editorial relationship approved','manual',now);
   }
   d.prepare('UPDATE editorial_reviews SET status=?,reviewed_at=? WHERE id=?').run(input.decision,now,input.id);return Response.json({ok:true});
  }
  if(body.action==='featuredPath'){
   const value=z.object({title:text,description:text,from:id,to:id}).parse(body.data);
   const graph=atlas();if(value.from===value.to||!graph.nodes.some(n=>n.id===value.from)||!graph.nodes.some(n=>n.id===value.to)||!findPath(graph.edges,value.from,value.to))throw new Error('Choose two connected entities');
   d.prepare("INSERT INTO metadata VALUES('featured-path',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(value));return Response.json({ok:true});
  }
  if(body.action==='watchlist'){
   const input=z.object({label:text,nodeIds:z.array(id)}).parse(body.data);for(const n of input.nodeIds)if(!d.prepare('SELECT id FROM nodes WHERE id=?').get(n))throw new Error('Unknown entity');d.prepare('INSERT INTO watchlists VALUES(?,?,?)').run(randomUUID(),input.label,JSON.stringify(input.nodeIds));return Response.json({ok:true});
  }
  throw new Error('Unknown action');
 });
 }catch(e){return Response.json({error:e instanceof z.ZodError?'Please check the required fields.':e instanceof Error?e.message:'Invalid request'},{status:400});}
}
