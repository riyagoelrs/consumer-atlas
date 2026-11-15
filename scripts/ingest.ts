import { runIngestion } from '../lib/ingestion';
runIngestion().then(console.log).catch(e=>{console.error(e.message);process.exitCode=1;});
