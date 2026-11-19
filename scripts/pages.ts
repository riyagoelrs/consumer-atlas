import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Publish the reviewed, public research snapshot; never bundle environment files or editorial queues.
const source='preview/consumer-atlas-preview.html';
const document=readFileSync(source);
if(!document.toString('utf8').startsWith('<!doctype html>'))throw new Error('Preview is not a complete HTML document');
mkdirSync('docs',{recursive:true});
copyFileSync(source,'docs/index.html');
writeFileSync('docs/.nojekyll','');
writeFileSync('docs/version.json',JSON.stringify({source_commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha256:createHash('sha256').update(document).digest('hex')},null,2)+'\n');
console.log('GitHub Pages content prepared in docs/. Publish main /docs in repository Settings → Pages.');
