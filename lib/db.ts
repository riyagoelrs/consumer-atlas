import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { themes, nodes, edges, sources } from './seed';
import { expandedNodes, expandedSources, expandedEdges, expandedNodeSources } from './expanded-research';
import type { Atlas, AtlasNode, Edge, Source } from './types';
let instance: DatabaseSync | undefined;
export function db(){
 if(instance) return instance;
 const path=process.env.ATLAS_DB_PATH || join(process.cwd(),'.data','atlas.sqlite');
 mkdirSync(dirname(path),{recursive:true});
 const d=new DatabaseSync(path); d.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 d.exec(readFileSync(join(process.cwd(),'migrations/001_init.sql'),'utf8')); instance=d;
 if(!d.prepare("SELECT value FROM metadata WHERE key='seed-v1'").get()){
  d.exec('BEGIN');
  try {
   for(const t of themes)d.prepare('INSERT OR IGNORE INTO themes VALUES(?,?,?)').run(t.id,t.name,JSON.stringify(t));
   for(const n of nodes) saveNode(n,d);
   for(const s of sources) saveSource(s,d);
   for(const e of edges) saveEdge(e,d);
   for(const [n,s] of [['ballerina','farm-site'],['ballerina','farm-profile'],['nara','nara-profile'],['balletcore','ballet-ref'],['cottagecore','cottage-ref'],['tradwife','trad-ref']])d.prepare('INSERT OR IGNORE INTO node_sources VALUES(?,?)').run(n,s);
   d.prepare("INSERT INTO signals VALUES(?,NULL,NULL,?,'seed',?,NULL)").run('seed-catalogue','Foundational research collection added',new Date().toISOString());
   d.prepare("INSERT INTO metadata VALUES('seed-v1','1')").run(); d.exec('COMMIT');
  }catch(e){d.exec('ROLLBACK');throw e;}
 }
 if(!d.prepare("SELECT value FROM metadata WHERE key='catalogue-v2'").get()){
  d.exec('BEGIN');
  try{
   const sourceIds=new Map<string,string>();
   for(const s of expandedSources){
    const existing=d.prepare('SELECT id FROM sources WHERE url=? OR id=? LIMIT 1').get(s.url,s.id);
    if(existing)sourceIds.set(s.id,String(existing.id));else{saveSource(s,d);sourceIds.set(s.id,s.id);}
   }
   for(const n of expandedNodes)if(!d.prepare('SELECT id FROM nodes WHERE id=?').get(n.id))saveNode(n,d);
   for(const e of expandedEdges)if(!d.prepare('SELECT id FROM edges WHERE id=?').get(e.id))saveEdge({...e,evidence:e.evidence.map(id=>sourceIds.get(id)||id)},d);
   for(const [n,s] of expandedNodeSources)d.prepare('INSERT OR IGNORE INTO node_sources VALUES(?,?)').run(n,sourceIds.get(s)||s);
   d.prepare("INSERT OR IGNORE INTO signals VALUES('catalogue-v2',NULL,NULL,'Second survey: expanded cultural research catalogue','seed',?,NULL)").run(new Date().toISOString());
   d.prepare("INSERT INTO metadata VALUES('catalogue-v2','1')").run();d.exec('COMMIT');
  }catch(error){d.exec('ROLLBACK');instance=undefined;d.close();throw error;}
 }
 return d;
}
export function saveNode(n:AtlasNode,d=db()){
 d.prepare('INSERT INTO nodes VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,type=excluded.type,data=excluded.data,updated_at=excluded.updated_at').run(n.id,n.name,n.type,JSON.stringify(n),new Date().toISOString(),n.updated);
 d.prepare('DELETE FROM node_theme_memberships WHERE node_id=?').run(n.id);
 for(const t of n.themes)d.prepare('INSERT INTO node_theme_memberships VALUES(?,?)').run(n.id,t);
}
export function saveSource(s:Source,d=db()){d.prepare('INSERT INTO sources VALUES(?,?,?) ON CONFLICT(url) DO NOTHING').run(s.id,s.url,JSON.stringify(s));}
export function saveEdge(e:Edge,d=db()){
 d.prepare('INSERT INTO edges VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,target_id=excluded.target_id,type=excluded.type,status=excluded.status,data=excluded.data').run(e.id,e.source,e.target,e.type,e.status,JSON.stringify(e));
 d.prepare('DELETE FROM edge_evidence WHERE edge_id=?').run(e.id);
 for(const s of e.evidence)d.prepare('INSERT INTO edge_evidence VALUES(?,?)').run(e.id,s);
}
export function transaction<T>(fn:()=>T):T{const d=db();d.exec('BEGIN IMMEDIATE');try{const out=fn();d.exec('COMMIT');return out;}catch(e){d.exec('ROLLBACK');throw e;}}
export function atlas():Atlas{
 const d=db();const parse=(table:string)=>d.prepare(`SELECT data FROM ${table}`).all().map(r=>JSON.parse(r.data as string));
 const job=d.prepare('SELECT * FROM ingestion_jobs ORDER BY started_at DESC LIMIT 1').get();
 const featured=d.prepare("SELECT value FROM metadata WHERE key='featured-path'").get();
 return {featuredPath:featured?JSON.parse(featured.value as string):null,themes:parse('themes'),nodes:parse('nodes'),edges:parse('edges'),sources:parse('sources'),signals:d.prepare('SELECT id,node_id AS nodeId,source_id AS sourceId,title,kind,created_at AS created,published_at AS published FROM signals ORDER BY created_at DESC LIMIT 150').all() as unknown as Atlas['signals'],events:d.prepare('SELECT id,node_id AS nodeId,title,event_date AS date,source_id AS sourceId FROM node_events ORDER BY event_date DESC').all() as unknown as Atlas['events'],sourceStatus:[{name:'The Guardian · Life & style RSS',status:job?String(job.status):'not connected',lastRun:job?String(job.started_at):null,error:job?.error?String(job.error):null},{name:'Social discovery APIs',status:'not configured',lastRun:null,error:'Manual public links and official embeds are available. Discovery API credentials are not configured.'}]};
}
