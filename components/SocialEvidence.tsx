'use client';
import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { Source } from '@/lib/types';
import { socialTarget } from '@/lib/evidence';
export default function SocialEvidence({source}:{source:Source}){
 const [open,setOpen]=useState(false);let target;try{target=socialTarget(source.url);}catch{return null;}
 return <article className="evidence"><div className="eyebrow">{source.publisher} <span>↗</span></div><a href={source.url} target="_blank" rel="noopener noreferrer" className="evidence-title">{source.title}<ArrowUpRight size={14}/></a><p>{source.annotation}</p><div className="evidence-meta">{source.published?new Date(source.published).toLocaleDateString('en-US',{timeZone:'UTC'}):'Publication date not recorded'} · {source.available}</div>{target.embed&&<><button className="text-button" onClick={()=>setOpen(!open)}><Play size={12}/>{open?'Close embed':'Load official embed'}</button>{open&&<><iframe title={source.title} src={target.embed} loading="lazy" allow="encrypted-media; fullscreen" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin"/><p className="muted">If the embed is unavailable, <a href={source.url} target="_blank" rel="noopener noreferrer">open the original post ↗</a>.</p></>}</>}</article>;
}
