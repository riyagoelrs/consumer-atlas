export function normalizeUrl(input:string){
 const u=new URL(input);if(u.protocol!=='https:'||u.username||u.password||u.port)throw new Error('Use a public HTTPS URL without credentials or a custom port.');
 if(['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(u.hostname)||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal'))throw new Error('Use a public source URL.');
 for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_')||['fbclid','gclid','igsh'].includes(key))u.searchParams.delete(key);
 u.hash='';return u.toString();
}
export function socialTarget(input:string){
 const url=normalizeUrl(input),u=new URL(url),host=u.hostname.replace(/^www\./,'');
 if(['twitter.com','x.com'].includes(host)){const m=u.pathname.match(/^\/\w+\/status\/(\d+)\/?$/);if(m)return {platform:'x',externalId:m[1],embed:`https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`,url};}
 if(host==='instagram.com'){const m=u.pathname.match(/^\/(p|reel)\/([\w-]+)\/?$/);if(m)return {platform:'instagram',externalId:m[2],embed:`https://www.instagram.com/${m[1]}/${m[2]}/embed/`,url};}
 if(host==='tiktok.com'){const m=u.pathname.match(/^\/@[\w.]+\/video\/(\d+)\/?$/);if(m)return {platform:'tiktok',externalId:m[1],embed:`https://www.tiktok.com/player/v1/${m[1]}`,url};}
 return {platform:'article',externalId:null,embed:null,url};
}
