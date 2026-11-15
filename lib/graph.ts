import type { AtlasNode, Edge } from './types';
export function searchNodes(nodes:AtlasNode[],query:string){const q=query.toLowerCase().trim();return nodes.filter(n=>[n.name,...n.aliases].some(s=>s.toLowerCase().includes(q)));}
export function findPath(edges:Edge[],from:string,to:string){
 // Dijkstra: penalize weak, unsupported and interpretive edges. This is a research traversal, not causal direction.
 const distance=new Map<string,number>([[from,0]]),paths=new Map<string,Edge[]>(); const seen=new Set<string>();
 while(true){const next=[...distance].filter(([id])=>!seen.has(id)).sort((a,b)=>a[1]-b[1])[0];if(!next) return null;const [id,cost]=next;if(id===to)return paths.get(id)||[];seen.add(id);
 for(const e of edges.filter(e=>e.source===id||e.target===id)){const other=e.source===id?e.target:e.source;const weight=1+(1-e.confidence)*2+(e.evidence.length?0:.65)+(e.status==='hypothesis'?1:.2);if(cost+weight<(distance.get(other)??Infinity)){distance.set(other,cost+weight);paths.set(other,[...(paths.get(id)||[]),e]);}}
 }
}
export function connectedIds(edges:Edge[],id:string){return new Set([id,...edges.filter(e=>e.source===id||e.target===id).flatMap(e=>[e.source,e.target])]);}
