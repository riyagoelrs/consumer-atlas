const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
export {roman};
export function coastline(cx:number,cy:number,r:number,phase:number){
 const points=Array.from({length:72},(_,i)=>{const a=i/72*Math.PI*2;const radius=r*(.94+.07*Math.sin(a*5+phase)+.045*Math.sin(a*11-phase));return [cx+Math.cos(a)*radius,cy+Math.sin(a)*radius*.86];});
 return points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')+' Z';
}
export default function CartographicPlate(){return <g className="cartographic-plate" aria-hidden="true" pointerEvents="none">
 <defs><pattern id="engraving" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><path d="M0 0V5" stroke="#786344" strokeWidth=".55" opacity=".26"/></pattern><pattern id="meridians" width="180" height="160" patternUnits="userSpaceOnUse"><path d="M180 0H0V160" fill="none" stroke="#97835c" strokeWidth=".6" strokeDasharray="1 5" opacity=".45"/></pattern></defs>
 <rect x="55" y="65" width="1490" height="950" fill="url(#meridians)"/>
 <rect x="42" y="52" width="1516" height="976" rx="2" fill="none" stroke="#77603c" strokeWidth="2"/>
 <rect x="51" y="61" width="1498" height="958" fill="none" stroke="#89714b" strokeWidth=".7"/>
 <rect x="36" y="46" width="1528" height="988" fill="none" stroke="#89714b" strokeWidth=".6"/>
 {Array.from({length:61},(_,i)=><g key={i}><path d={`M${55+i*24.8} 52v${i%5?5:10} M${55+i*24.8} 1028v-${i%5?5:10}`} stroke="#77603c" strokeWidth=".7"/></g>)}
 {Array.from({length:39},(_,i)=><path key={i} d={`M42 ${65+i*24.8}h${i%5?5:10} M1558 ${65+i*24.8}h-${i%5?5:10}`} stroke="#77603c" strokeWidth=".7"/>)}
 {'ABCDEFGH'.split('').map((letter,i)=><g key={letter}><text x={145+i*182} y="39" textAnchor="middle" className="grid-index">{letter}</text><text x={145+i*182} y="1052" textAnchor="middle" className="grid-index">{letter}</text></g>)}
 {Array.from({length:6},(_,i)=><g key={i}><text x="20" y={150+i*160} textAnchor="middle" className="grid-index">{i+1}</text><text x="1580" y={150+i*160} textAnchor="middle" className="grid-index">{i+1}</text></g>)}
 <g className="rhumb-lines">{[0,1,2].map(k=><g key={k}>{Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,cx=[170,820,1430][k],cy=[900,490,150][k];return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*900} y2={cy+Math.sin(a)*900} stroke="#8e7952" strokeWidth=".4" opacity=".12"/>;})}</g>)}</g>
 <g transform="translate(810 95)"><path d="M-216 -24Q-240 -24 -240 0Q-240 24 -216 24H216Q240 24 240 0Q240 -24 216 -24Z" fill="#eee3cb" stroke="#88704a" strokeWidth=".7"/><path d="M-208 -31H208M-208 31H208" stroke="#88704a" strokeWidth=".5"/><text textAnchor="middle" y="5" className="plate-title">ATLAS OF CONSUMER CULTURE</text><text textAnchor="middle" y="48" className="plate-subtitle">A survey of affinities, rituals & the commerce of everyday life</text></g>
 <g transform="translate(145 825)"><circle r="48" fill="none" stroke="#88704a" strokeWidth=".6"/><circle r="37" fill="none" stroke="#88704a" strokeWidth=".5"/>{Array.from({length:16},(_,i)=><g key={i} transform={`rotate(${i*22.5})`}><path d={`M0 ${i%2?-36:-58}L-5 0H0Z`} fill="#7c6340"/><path d={`M0 ${i%2?-36:-58}L5 0H0Z`} fill="#d6c49d" stroke="#7c6340" strokeWidth=".5"/></g>)}<circle r="5" fill="#eee3cb" stroke="#7c6340"/><text y="-69" textAnchor="middle" className="compass-letter">N</text><text x="70" y="5" textAnchor="middle" className="compass-letter">E</text><text y="82" textAnchor="middle" className="compass-letter">S</text><text x="-70" y="5" textAnchor="middle" className="compass-letter">W</text></g>
 <g transform="translate(1180 1006)"><path d="M0 -4V4H240V-4M0 0H240" fill="none" stroke="#77603c"/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${i*48} 0v4`} stroke="#77603c"/>)}<text x="120" y="-12" textAnchor="middle" className="plate-subtitle">RELATIONAL DISTANCE · NOT GEOGRAPHIC</text></g>
 <text x="90" y="986" className="plate-subtitle">PLATE I · THE SECOND SURVEY</text>
 <text x="1500" y="87" textAnchor="end" className="plate-subtitle">INDEX GRID / CONCEPTUAL PROJECTION</text>
 </g>;}
