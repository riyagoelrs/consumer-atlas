import { authorized, checkOrigin } from '@/lib/auth';
import { runIngestion } from '@/lib/ingestion';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:Request){if(!checkOrigin(req)||(!authorized(req)&&!authorized(req,'cron')))return Response.json({error:'Unauthorized'},{status:401});try{return Response.json(await runIngestion());}catch(e){return Response.json({error:e instanceof Error?e.message:'Ingestion failed'},{status:502});}}
// Vercel Cron sends an Authorization bearer header. No public unauthenticated job trigger.
export async function GET(req:Request){if(!authorized(req,'cron'))return Response.json({error:'Unauthorized'},{status:401});return POST(req);}
