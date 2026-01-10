
import React, { useState } from 'react';
import { Episode } from '../types';

interface EpisodeListViewProps {
  episodes: Episode[];
  onAdd: (title: string, script: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

const EpisodeListView: React.FC<EpisodeListViewProps> = ({ episodes, onAdd, onDelete, onOpen }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !script) return;
    onAdd(title, script);
    setTitle('');
    setScript('');
    setIsAdding(false);
  };

  const calculateTotalDuration = (episode: Episode) => {
    if (!episode.shots || episode.shots.length === 0) return 0;
    return episode.shots.reduce((acc, shot) => {
      const d = parseFloat(shot.duration) || 0;
      return acc + d;
    }, 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">剧集管理系统</h2>
          <p className="text-gray-400 text-sm">输入原著剧本，AI 将自动锁定视觉锚点并计算分镜时长。</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-bold">新建剧集</span>
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">创建新剧集</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">剧集名称</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="例如：第一集 宿命的对决"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">原著剧本原文</label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full h-64 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="在此粘贴原著内容。AI 会确保台词和剧情 1:1 还原，并进行时空拆解以满足 2 分钟时长。"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2 text-gray-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {episodes.map(ep => {
          const totalSeconds = calculateTotalDuration(ep);
          const isMeetsTarget = totalSeconds >= 120;
          
          return (
            <div 
              key={ep.id} 
              className="bg-[#141414] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all group flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center space-x-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${
                  ep.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                  ep.status === 'generating' ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 'bg-white/5 text-gray-500'
                }`}>
                  {ep.status === 'completed' ? '✓' : 'EP'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{ep.title}</h3>
                  <div className="flex items-center space-x-5 mt-2 text-[11px] uppercase tracking-wider font-bold">
                    <span className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {ep.shots.length || 0} 镜
                    </span>
                    <span className={`flex items-center ${isMeetsTarget ? 'text-green-500' : 'text-orange-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      预估时长: {formatDuration(totalSeconds)}
                      {ep.shots.length > 0 && !isMeetsTarget && <span className="ml-2 text-[10px] opacity-70">(建议重试拆解)</span>}
                    </span>
                    <span className="text-gray-600">
                      {new Date(ep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onDelete(ep.id)}
                  className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="删除剧集"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => onOpen(ep.id)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-blue-600 text-white rounded-xl border border-white/10 hover:border-blue-600 transition-all font-bold text-sm shadow-sm"
                >
                  进入编辑工作台
                </button>
              </div>
            </div>
          );
        })}
        {episodes.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl text-white font-medium mb-2">暂无剧集数据</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
              点击右上角“新建剧集”，开始利用时空拆解法制作 2 分钟以上的动漫分镜表。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeListView;
