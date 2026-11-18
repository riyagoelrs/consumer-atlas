import { createRoot } from 'react-dom/client';
import AtlasExplorer from '../components/AtlasExplorer';
import type { Atlas, Source } from '../lib/types';
import '../app/globals.css';
declare const __ATLAS_SNAPSHOT__:{atlas:Atlas;nodeSources:Record<string,Source[]>};
const {atlas,nodeSources}=__ATLAS_SNAPSHOT__;
createRoot(document.getElementById('root')!).render(<AtlasExplorer initialData={atlas} readOnlyPreview previewSources={nodeSources}/>);
