import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(_:Request,context:{params:Promise<{id:string}>}){const {id}=await context.params;const d=db();if(!d.prepare('SELECT id FROM nodes WHERE id=?').get(id))return Response.json({error:'Not found'},{status:404});return Response.json(d.prepare('SELECT s.data FROM sources s JOIN node_sources ns ON s.id=ns.source_id WHERE ns.node_id=?').all(id).map(s=>JSON.parse(s.data as string)));}
