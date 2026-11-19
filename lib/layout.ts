import type { Atlas, AtlasNode } from './types';
export const provincePositions:Record<string,[number,number,number]>={fashion:[320,300,135],beauty:[635,280,104],wellness:[965,305,115],climate:[1320,230,103],identity:[285,610,110],food:[680,570,145],digital:[1290,565,120],home:[340,885,115],commerce:[770,885,116],leisure:[1065,850,100],media:[1330,860,100]};
export function mapPositions(data:Atlas,isUniverse:boolean,visible:Set<string>){
 const result=new Map<string,{x:number;y:number}>();
 for(const theme of data.themes){
  const members=data.nodes.filter(n=>n.themes[0]===theme.id&&visible.has(n.id));
  const [cx,cy,radius]=provincePositions[theme.id]||[800,540,120];
  members.forEach((n,i)=>{
   const angle=i*2.399963229728653+theme.id.length*.6;
   const r=Math.sqrt((i+.6)/(members.length+.5))*radius*.82;
   result.set(n.id,{x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r});
  });
 }
 if(!isUniverse){
  // A deterministic broad grid avoids the overlapping spiral labels of the initial catalogue.
  const members=data.nodes.filter(n=>visible.has(n.id));
  const columns=Math.max(4,Math.ceil(Math.sqrt(members.length*1.65)));
  const rows=Math.ceil(members.length/columns);
  members.forEach((n,i)=>result.set(n.id,{x:140+(i%columns)*(1320/Math.max(columns-1,1)),y:190+Math.floor(i/columns)*(680/Math.max(rows-1,1))}));
 }
 return result;
}
export function splitLabel(name:string,max=22){
 if(name.length<=max)return [name];const words=name.split(' ');const lines:string[]=[''];for(const w of words){if((lines[lines.length-1]+' '+w).trim().length>max&&lines[lines.length-1])lines.push(w);else lines[lines.length-1]=(lines[lines.length-1]+' '+w).trim();}return lines;
}
