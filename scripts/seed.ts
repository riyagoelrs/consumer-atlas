import { atlas } from '../lib/db';
const data=atlas();console.log(`Database ready: ${data.nodes.length} nodes, ${data.edges.length} relationships, ${data.themes.length} themes.`);
