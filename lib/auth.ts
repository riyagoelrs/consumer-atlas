import { timingSafeEqual } from 'node:crypto';
export function authorized(request:Request,kind:'admin'|'cron'='admin'){
 const expected=kind==='admin'?process.env.ADMIN_TOKEN:process.env.CRON_SECRET;
 if(!expected||expected.length<32)return false;
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const a=Buffer.from(supplied),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);
}
export function checkOrigin(req:Request){
 const origin=req.headers.get('origin');if(!origin)return true;
 try{const parsed=new URL(origin);return ['http:','https:'].includes(parsed.protocol)&&(origin===new URL(req.url).origin||parsed.host===req.headers.get('host'));}catch{return false;}
}
