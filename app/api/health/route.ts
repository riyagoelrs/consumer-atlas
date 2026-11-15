import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export function GET(){try{db().prepare('SELECT 1').get();return Response.json({status:'ok',storage:'sqlite'});}catch{return Response.json({status:'unavailable'},{status:503});}}
