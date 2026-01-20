import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Project, KBFile, Episode, Shot } from './types';
import Sidebar from './components/Sidebar';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import EpisodeListView from './components/EpisodeListView';
import StoryboardEditor from './components/StoryboardEditor';
import ProjectHub from './components/ProjectHub';

const App: React.FC = () => {
  // --- 核心状态控制 ---
  const [activeTab, setActiveTab] = useState<'hub' | 'kb' | 'episodes' | 'editor'>('hub');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('vidu_projects_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // --- 自动保存至浏览器缓存 ---
  useEffect(() => {
    localStorage.setItem('vidu_projects_data', JSON.stringify(projects));
  }, [projects]);

  // --- 数据分发逻辑 ---
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId) || null, [projects, activeProjectId]);
  const kb = activeProject?.knowledgeBase || [];
  const episodes = activeProject?.episodes || [];
  const currentEpisode = episodes.find(e => e.id === currentEpisodeId);

  // --- 项目管理函数 ---
  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      knowledgeBase: [],
      episodes: [],
      lastModified: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveTab('kb');
  }, []);

  const deleteProject = useCallback((id: string) => {
    if (window.confirm('确定删除该作品吗？')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setActiveTab('hub');
      }
    }
  }, [activeProjectId]);

  // --- 辅助更新函数：保持原本业务逻辑不变 ---
  const updateProjectData = useCallback((updates: Partial<Project>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, ...updates, lastModified: Date.now() } : p
    ));
  }, [activeProjectId]);

  // --- 以下为你原本的业务函数，逻辑已迁移至项目内部 ---
  const addKBFile = useCallback((file: KBFile) => {
    updateProjectData({ knowledgeBase: [...kb, file] });
  }, [kb, updateProjectData]);

  const removeKBFile = useCallback((id: string) => {
    updateProjectData({ knowledgeBase: kb.filter(f => f.id !== id) });
  }, [kb, updateProjectData]);

  const addEpisode = useCallback((title: string, script: string) => {
    const newEpisode: Episode = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      script,
      status: 'draft',
      shots: [],
      createdAt: Date.now()
    };
    updateProjectData({ episodes: [newEpisode, ...episodes] });
  }, [episodes, updateProjectData]);

  const updateEpisode = useCallback((id: string, updates: Partial<Episode>) => {
    updateProjectData({
      episodes: episodes.map(ep => ep.id === id ? { ...ep, ...updates } : ep)
    });
  }, [episodes, updateProjectData]);

  const deleteEpisode = useCallback((id: string) => {
    updateProjectData({
      episodes: episodes.filter(ep => ep.id !== id)
    });
    if (currentEpisodeId === id) setCurrentEpisodeId(null);
  }, [currentEpisodeId, episodes, updateProjectData]);

  const openEpisode = useCallback((id: string) => {
    setCurrentEpisodeId(id);
    setActiveTab('editor');
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        episodeCount={episodes.length}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'hub' && (
          <ProjectHub 
            projects={projects}
            onSelect={(id) => { setActiveProjectId(id); setActiveTab('episodes'); }}
            onCreate={createProject}
            onDelete={deleteProject}
          />
        )}

        {activeTab === 'kb' && activeProject && (
          <KnowledgeBaseView files={kb} onAdd={addKBFile} onRemove={removeKBFile} />
        )}
        
        {activeTab === 'episodes' && activeProject && (
          <EpisodeListView episodes={episodes} onAdd={addEpisode} onDelete={deleteEpisode} onOpen={openEpisode} />
        )}
        
        {activeTab === 'editor' && currentEpisode && (
          <StoryboardEditor 
            episode={currentEpisode} 
            kb={kb}
            onUpdate={(updates) => updateEpisode(currentEpisode.id, updates)}
            onBack={() => setActiveTab('episodes')}
          />
        )}

        {activeTab !== 'hub' && !activeProject && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请先在“作品中心”选择或创建一个项目
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
