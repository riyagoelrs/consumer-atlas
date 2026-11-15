import { atlas } from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(){try{return Response.json(atlas(),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('atlas read failed',e);return Response.json({error:'Research database is unavailable.'},{status:503});}}
