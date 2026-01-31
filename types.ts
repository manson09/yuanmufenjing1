export type ScriptStyle = '情绪流' | '非情绪流';
export interface KBFile {
  id: string;
  name: string;
  type: string;
  content: string;
  uploadDate: number;
}

export interface Shot {
  shotNumber: number;
  duration: string; // e.g. "3.5s"
  shotType: string; // 特写, 全景, etc.
  movement: string; // 环绕, 推近, etc.
  visualDescription: string;
  dialogue: string;
  emotion: string; // 【愤怒】, 【冷酷】, etc.
  viduPrompt: string; // Optimized for Vidu
}

export interface Episode {
  id: string;
  title: string;
  script: string;
  status: 'draft' | 'generating' | 'completed';
  shots: Shot[];
  createdAt: number;
}

export interface AppState {
  knowledgeBase: KBFile[];
  episodes: Episode[];
  currentEpisodeId: string | null;
}
export interface Project {
  id: string;
  name: string;               
  knowledgeBase: KBFile[];   
  episodes: Episode[];        
  lastModified: number; 
}
