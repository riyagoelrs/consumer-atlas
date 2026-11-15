import AtlasExplorer from '@/components/AtlasExplorer';
import type { Atlas } from '@/lib/types';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export default async function Page(){
 let initialData:Atlas|null=null;
 let initialError='';
 try{
  const { atlas }=await import('@/lib/db');
  // SQLite rows have null prototypes; React's server/client boundary requires plain JSON objects.
  initialData=JSON.parse(JSON.stringify(atlas())) as Atlas;
 }catch(error){
  console.error('Initial atlas load failed',error);
  initialError='The research database could not be opened. Check the server terminal and use Node.js 24 or newer.';
 }
 return <AtlasExplorer initialData={initialData} initialError={initialError}/>;
}
