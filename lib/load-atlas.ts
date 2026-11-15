import type { Atlas } from './types';

export async function loadAtlas(request:typeof fetch=fetch,timeoutMs=15000):Promise<Atlas>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await request('/api/atlas',{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error(`Research data could not be loaded (HTTP ${response.status}). Check the server terminal.`);
  const data=await response.json();
  if(!data||!['themes','nodes','edges','sources','signals','events','sourceStatus'].every(key=>Array.isArray(data[key])))throw new Error('The server returned invalid research data. Check the server terminal.');
  return data as Atlas;
 }catch(error){
  if(controller.signal.aborted)throw new Error('The research data request timed out. Check the server terminal, then try again.');
  throw error;
 }finally{clearTimeout(timer);}
}
