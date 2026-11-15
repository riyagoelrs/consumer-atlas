import { runIngestion } from '../lib/ingestion';
let running=false;
async function tick(){if(running)return;running=true;try{console.log(new Date().toISOString(),await runIngestion());}catch(e){console.error('Ingestion:',e instanceof Error?e.message:e);}finally{running=false;}}
void tick();const timer=setInterval(tick,30*60*1000);
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{clearInterval(timer);process.exit(0);});
