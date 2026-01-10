
import React, { useState, useCallback, useEffect } from 'react';
import { KBFile, Episode, Shot } from './types';
import Sidebar from './components/Sidebar';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import EpisodeListView from './components/EpisodeListView';
import StoryboardEditor from './components/StoryboardEditor';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kb' | 'episodes' | 'editor'>('episodes');
  const [kb, setKb] = useState<KBFile[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const savedKb = localStorage.getItem('vidu_kb');
    const savedEpisodes = localStorage.getItem('vidu_episodes');
    if (savedKb) setKb(JSON.parse(savedKb));
    if (savedEpisodes) setEpisodes(JSON.parse(savedEpisodes));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('vidu_kb', JSON.stringify(kb));
    localStorage.setItem('vidu_episodes', JSON.stringify(episodes));
  }, [kb, episodes]);

  const addKBFile = useCallback((file: KBFile) => {
    setKb(prev => [...prev, file]);
  }, []);

  const removeKBFile = useCallback((id: string) => {
    setKb(prev => prev.filter(f => f.id !== id));
  }, []);

  const addEpisode = useCallback((title: string, script: string) => {
    const newEpisode: Episode = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      script,
      status: 'draft',
      shots: [],
      createdAt: Date.now()
    };
    setEpisodes(prev => [newEpisode, ...prev]);
  }, []);

  const updateEpisode = useCallback((id: string, updates: Partial<Episode>) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, ...updates } : ep));
  }, []);

  const deleteEpisode = useCallback((id: string) => {
    setEpisodes(prev => prev.filter(ep => ep.id !== id));
    if (currentEpisodeId === id) setCurrentEpisodeId(null);
  }, [currentEpisodeId]);

  const openEpisode = useCallback((id: string) => {
    setCurrentEpisodeId(id);
    setActiveTab('editor');
  }, []);

  const currentEpisode = episodes.find(e => e.id === currentEpisodeId);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        episodeCount={episodes.length}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'kb' && (
          <KnowledgeBaseView 
            files={kb} 
            onAdd={addKBFile} 
            onRemove={removeKBFile} 
          />
        )}
        
        {activeTab === 'episodes' && (
          <EpisodeListView 
            episodes={episodes} 
            onAdd={addEpisode} 
            onDelete={deleteEpisode}
            onOpen={openEpisode}
          />
        )}
        
        {activeTab === 'editor' && currentEpisode && (
          <StoryboardEditor 
            episode={currentEpisode} 
            kb={kb}
            onUpdate={(updates) => updateEpisode(currentEpisode.id, updates)}
            onBack={() => setActiveTab('episodes')}
          />
        )}

        {!currentEpisode && activeTab === 'editor' && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请先在“剧集列表”中选择或创建一个剧集
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
