export type Status = 'verified' | 'interpretation' | 'hypothesis';
export type Theme = { id: string; name: string; subtitle: string; color: string; x: number; y: number; radius: number };
export type AtlasNode = { id: string; name: string; aliases: string[]; type: string; description: string; cultural: string; commercial: string; themes: string[]; status: Status; updated: string; x: number; y: number };
export type Edge = { id: string; source: string; target: string; type: string; explanation: string; status: Status; confidence: number; evidence: string[]; reviewed: string; bidirectional: boolean };
export type Source = { id: string; title: string; url: string; publisher: string; platform: string; published: string | null; annotation: string; available: string };
export type Signal = { id: string; title: string; nodeId: string | null; sourceId: string | null; created: string; published: string | null; kind: string };
export type FeaturedPath = {title:string;description:string;from:string;to:string};
export type Atlas = { featuredPath: FeaturedPath | null; themes: Theme[]; nodes: AtlasNode[]; edges: Edge[]; sources: Source[]; signals: Signal[]; events: { id: string; nodeId: string; title: string; date: string; sourceId: string | null }[]; sourceStatus: { name: string; status: string; lastRun: string | null; error: string | null }[] };
