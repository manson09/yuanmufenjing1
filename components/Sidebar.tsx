
import React from 'react';

interface SidebarProps {
  activeTab: 'kb' | 'episodes' | 'editor';
  setActiveTab: (tab: 'kb' | 'episodes' | 'editor') => void;
  episodeCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, episodeCount }) => {
  return (
    <div className="w-64 bg-[#141414] border-r border-white/5 flex flex-col h-full">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          ViduAnime AI
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">专业级分镜生成</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveTab('kb')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'kb' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="font-medium">原著知识库</span>
        </button>

        <button
          onClick={() => setActiveTab('episodes')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
            activeTab === 'episodes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">剧集管理</span>
          </div>
          <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{episodeCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'editor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">分镜工作室</span>
        </button>
      </nav>

      <div className="p-4 bg-white/5 mx-4 mb-6 rounded-xl">
        <div className="flex items-center space-x-2 text-xs text-blue-400 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>Gemini Pro 已连接</span>
        </div>
        <div className="text-[10px] text-gray-500 leading-relaxed">
          Vidu 优化模式开启，正在实施 2:00+ 时空拆解核心算法。
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
