'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import type { Atlas, AtlasNode, Edge } from '@/lib/types';
import { connectedIds } from '@/lib/graph';
import { mapPositions, provincePositions, splitLabel } from '@/lib/layout';
import CartographicPlate,{coastline,roman} from './CartographicPlate';
type Props={data:Atlas;mode:string;theme:string;selected:string|null;selectedEdge:string|null;investor:boolean;path:Edge[];visible:Set<string>;onTheme:(id:string)=>void;onNode:(id:string)=>void;onEdge:(id:string)=>void};
const actionable=(fn:()=>void)=>({role:'button' as const,tabIndex:0,onClick:(e:React.MouseEvent)=>{e.stopPropagation();fn();},onKeyDown:(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}}});
export default function AtlasCanvas({data,mode,theme,selected,selectedEdge,investor,path,visible,onTheme,onNode,onEdge}:Props){
 const svgRef=useRef<SVGSVGElement>(null),groupRef=useRef<SVGGElement>(null),behavior=useRef<ZoomBehavior<SVGSVGElement,unknown>>(null);
 const [scale,setScale]=useState(1),[hover,setHover]=useState<string|null>(null);
 const isUniverse=mode==='Universe';
 useEffect(()=>{if(!svgRef.current)return;const z=zoom<SVGSVGElement,unknown>().scaleExtent([.55,4]).on('zoom',event=>{select(groupRef.current).attr('transform',event.transform.toString());setScale(event.transform.k);});behavior.current=z;const svg=select(svgRef.current);svg.call(z);return ()=>{svg.on('.zoom',null);};},[]);
 useEffect(()=>{if(svgRef.current&&behavior.current)select(svgRef.current).call(behavior.current.transform,zoomIdentity);},[mode,theme]);
 const positions=useMemo(()=>mapPositions(data,isUniverse,visible),[data,isUniverse,visible]);
 const connected=selected?connectedIds(data.edges,selected):null,pathIds=new Set(path.flatMap(e=>[e.source,e.target])),pathEdges=new Set(path.map(e=>e.id));
 const graphNodes=data.nodes.filter(n=>visible.has(n.id)),graphIds=new Set(graphNodes.map(n=>n.id));
 const names=new Map(data.nodes.map(n=>[n.id,n.name]));
 function dim(n:AtlasNode){return (connected&&!connected.has(n.id))||(pathIds.size&&!pathIds.has(n.id))||(investor&&!['Commercial theme','Market','Investment thesis','Creator','Brand','Platform'].includes(n.type));}
 function edgeActive(e:Edge){return pathEdges.has(e.id)||e.id===selectedEdge||e.source===selected||e.target===selected||e.source===hover||e.target===hover;}
 const activeTheme=data.themes.find(t=>t.id===theme),hovered=data.nodes.find(n=>n.id===hover);
 return <div className={`canvas-shell ${isUniverse?'universe':'network'}`}>
 <div className="canvas-heading"><span className="eyebrow">{isUniverse?'TABULA I / THE CONSUMER WORLD':`TABULA II / ${activeTheme?.name.toUpperCase()||'CONNECTED CULTURE'}`}</span><span className="canvas-hint">DRAG THE MAP · SCROLL TO EXAMINE</span></div>
 <svg ref={svgRef} viewBox="0 0 1600 1080" className="atlas-svg" aria-label={isUniverse?'Interactive consumer universe':'Interactive knowledge network'}>
 <g ref={groupRef}><CartographicPlate/>
 {isUniverse&&data.themes.map((t,i)=>{const [x,y,r]=provincePositions[t.id];return <g key={t.id} className="theme-system" {...actionable(()=>onTheme(t.id))} aria-label={`Explore ${t.name}`}>
 <path d={coastline(x,y,r+9,i)} fill="url(#engraving)" stroke={t.color} strokeWidth=".7" strokeOpacity=".5"/>
 <path d={coastline(x,y,r,i)} fill="#ede1c6" fillOpacity=".8" stroke={t.color} strokeWidth="1.1"/>
 <path d={coastline(x,y,r-5,i)} fill={t.color} fillOpacity=".065" stroke={t.color} strokeWidth=".45" strokeOpacity=".4"/>
 <text x={x} y={y-r*.87-27} textAnchor="middle" className="province-number">{roman[i]} · PROVINCE OF</text>
 <text x={x} y={y-r*.87-7} textAnchor="middle" className="theme-label">{t.name}</text>
 <text x={x} y={y+r*.87+24} textAnchor="middle" className="system-subtitle">{`${data.nodes.filter(n=>n.themes.includes(t.id)).length} CATALOGUED SUBJECTS`}</text>
 <title>{t.subtitle}</title></g>;})}
 <g>{data.edges.filter(e=>graphIds.has(e.source)&&graphIds.has(e.target)).map(e=>{const a=positions.get(e.source)!,b=positions.get(e.target)!,active=edgeActive(e),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const d=`M${a.x},${a.y} Q${mx+18},${my-24} ${b.x},${b.y}`;return <g key={e.id} className={`graph-edge ${active?'active':''}`} {...actionable(()=>onEdge(e.id))} aria-label={`${names.get(e.source)} ${e.type} ${names.get(e.target)}`}>
 <path d={d} fill="none" stroke={active?'#8b4733':'#887852'} strokeWidth={active?2:.7} strokeOpacity={active?.9:(path.length||selected)?.07:isUniverse?.14:.18} strokeDasharray={e.status==='hypothesis'?'3 5':undefined}/><path d={d} fill="none" stroke="transparent" strokeWidth="10"/>
 {!isUniverse&&active&&<g><rect x={mx-65} y={my-22} width="130" height="18" fill="#eee2c9"/><text x={mx} y={my-9} textAnchor="middle" className="edge-label">{e.type}</text></g>}<title>{`${e.type} · ${e.status}`}</title></g>;})}</g>
 {graphNodes.map((n,i)=>{const p=positions.get(n.id)!,t=data.themes.find(t=>t.id===n.themes[0])!,active=n.id===selected||pathIds.has(n.id),isHover=n.id===hover;
 const peers=graphNodes.filter(m=>m.themes[0]===n.themes[0]);const ranked=peers.indexOf(n);const showLabel=active||isHover||scale>1.5||(!isUniverse&&graphNodes.length<=45)||(!isUniverse&&['Brand','Creator'].includes(n.type))||(isUniverse&&[0,Math.floor(peers.length*.35),Math.floor(peers.length*.7),peers.length-1].includes(ranked));
 return <g key={n.id} className={`graph-node ${dim(n)&&!isHover?'dimmed':''} ${active?'selected':''}`} {...actionable(()=>onNode(n.id))} onMouseEnter={()=>setHover(n.id)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(n.id)} onBlur={()=>setHover(null)} aria-label={`Open ${n.name}`} transform={`translate(${p.x},${p.y})`}>
 {active&&<circle r={isUniverse?13:18} fill="#d9c49b" fillOpacity=".4" stroke="#8b4733" strokeWidth=".8"/>}
 {n.type==='Brand'||n.type==='Platform'?<rect x="-4" y="-4" width="8" height="8" fill={t.color} stroke="#f0e4cd" strokeWidth="1.5" transform="rotate(45)"/>:<circle r={n.type==='Creator'?5:3.5} fill={t.color} stroke="#f0e4cd" strokeWidth="1.2"/>}
 {showLabel&&<text x="0" y={isUniverse?16:21} textAnchor="middle" className={`node-label ${isUniverse?'macro-label':''}`} paintOrder="stroke" stroke="#eee2c9" strokeWidth="3.5">{splitLabel(n.name,isUniverse?21:24).map((line,j)=><tspan key={j} x="0" dy={j?14:0}>{line}</tspan>)}</text>}
 {!isUniverse&&(active||isHover||graphNodes.length<=30)&&<text y={21+splitLabel(n.name,24).length*14} textAnchor="middle" className="node-type">{n.type}</text>}
 <title>{`${n.name} · ${n.type}`}</title></g>;})}
 </g></svg>
 {hovered&&<div className="map-hover" role="status"><span className="eyebrow">{hovered.type}</span><strong>{hovered.name}</strong><p>{hovered.description}</p><span>Open dossier ↗</span></div>}
 {!graphNodes.length&&<div className="canvas-empty">No subjects match this survey.<br/>Widen the filters to return to the atlas.</div>}
 <div className="map-register"><div><span className="eyebrow">THE SURVEY REGISTER</span><strong>{data.nodes.length}<small>subjects</small></strong></div><div><span className="eyebrow">RELATIONAL ROUTES</span><strong>{data.edges.length}<small>connections</small></strong></div><div><span className="eyebrow">THE SOURCE ARCHIVE</span><strong>{data.sources.length}<small>reference destinations</small></strong></div></div>
 <div className="canvas-bottom"><div className="map-legend"><span>● Concept / person</span><span>◆ Brand / platform</span><span>— Editorial affinity</span><span>┄ Hypothesis</span></div><div className="zoom-controls"><button aria-label="Zoom out" onClick={()=>{if(svgRef.current&&behavior.current)select(svgRef.current).call(behavior.current.scaleBy,.8);}}><Minus size={15}/></button><span>{Math.round(scale*100)}%</span><button aria-label="Zoom in" onClick={()=>{if(svgRef.current&&behavior.current)select(svgRef.current).call(behavior.current.scaleBy,1.25);}}><Plus size={15}/></button><button aria-label="Reset map position" onClick={()=>{if(svgRef.current&&behavior.current)select(svgRef.current).call(behavior.current.transform,zoomIdentity);}}><Maximize2 size={14}/></button></div></div>
 </div>;
}
