import React, { useState } from 'react';
import { Episode, Shot, KBFile } from '../types';
import { generateStoryboard, regenerateSingleShot } from '../services/storyboardService';

interface StoryboardEditorProps {
  episode: Episode;
  kb: KBFile[];
  onUpdate: (updates: Partial<Episode>) => void;
  onBack: () => void;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode, kb, onUpdate, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0); // 0: 1-20, 1: 21-40, 2: 41-60

  // 1. 初始生成逻辑（只出前20个）
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // 这里的 0 代表第一批次，[] 代表没有上文
      const shots = await generateStoryboard(episode, kb, 0, []);
      onUpdate({ shots, status: 'generating' });
      setCurrentBatch(0);
    } catch (err) {
      setError('生成失败。请检查 API 配置或网络。');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. 继续生成后续逻辑
  const handleContinue = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const nextBatch = currentBatch + 1;
      // 传入当前 batch 索引和已有的 shots 作为参考
      const moreShots = await generateStoryboard(episode, kb, nextBatch, episode.shots);
      onUpdate({ 
        shots: [...episode.shots, ...moreShots], 
        status: nextBatch === 2 ? 'completed' : 'generating' 
      });
      setCurrentBatch(nextBatch);
    } catch (err) {
      setError('追加生成失败，请重试。');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. 单镜头重刷逻辑
  const handleRegenerateShot = async (index: number) => {
    const target = episode.shots[index];
    const prev = index > 0 ? episode.shots[index - 1] : undefined;
    
    try {
      // 这里需要确保你在 storyboardService 里导出了这个函数
      const newShot = await regenerateSingleShot(episode, kb, target, prev);
      const updatedShots = [...episode.shots];
      updatedShots[index] = newShot;
      onUpdate({ shots: updatedShots });
    } catch (err) {
      alert('重刷该镜头失败');
    }
  };

  const exportToWord = () => {
    const tableRows = episode.shots.map(s => `
      <tr style="background-color: ${s.shotNumber % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
        <td style="border: 1px solid #dddddd; padding: 8px; text-align: center; font-weight: bold;">${s.shotNumber}</td>
        <td style="border: 1px solid #dddddd; padding: 8px; text-align: center;">${s.duration}</td>
        <td style="border: 1px solid #dddddd; padding: 8px; color: #2563eb; font-weight: bold;">${s.shotType} / ${s.movement}</td>
        <td style="border: 1px solid #dddddd; padding: 8px; font-size: 11pt;">${s.visualDescription}</td>
        <td style="border: 1px solid #dddddd; padding: 8px; font-style: italic; color: #4b5563;">${s.dialogue || '-'}</td>
        <td style="border: 1px solid #dddddd; padding: 8px; font-size: 9pt; font-family: 'Courier New', monospace; color: #4f46e5;">${s.viduPrompt}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>专业分镜表 - ${episode.title}</title>
        <style>
          body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f3f4f6; border: 1px solid #dddddd; padding: 12px; text-align: left; font-weight: bold; font-size: 12pt; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .meta { margin-bottom: 20px; font-size: 10pt; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>专业动画分镜脚本 (Vidu 优化版)</h1>
          <div class="meta">剧集标题：${episode.title} | 导出日期：${new Date().toLocaleDateString()} | 总镜头：${episode.shots.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">镜号</th>
              <th style="width: 8%;">时长</th>
              <th style="width: 12%;">视听语言</th>
              <th style="width: 25%;">画面描述</th>
              <th style="width: 15%;">原著台词</th>
              <th style="width: 35%;">Vidu 一致性提示词</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${episode.title}_专业分镜表.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141414] shadow-xl relative z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              {episode.title}
              {episode.shots.length > 0 && <span className="ml-3 px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded uppercase border border-indigo-600/30 font-black">20 镜分布式模式</span>}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500 font-bold">已生成镜头：{episode.shots.length} / 60</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {episode.shots.length > 0 && (
            <button
              onClick={exportToWord}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center space-x-2 transition-all text-xs font-black border border-white/10"
            >
              <span>导出 Word</span>
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-xl font-black flex items-center space-x-2 transition-all shadow-xl ${
              isGenerating ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
            }`}
          >
            {isGenerating ? (
              <span className="text-sm">计算中...</span>
            ) : (
              <span className="text-sm">{episode.shots.length > 0 ? '重置并重新生成' : '开始智能生成'}</span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center space-x-3">
            <span>{error}</span>
          </div>
        )}

        {isGenerating && episode.shots.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold">正在执行第一阶段原子化拆解...</p>
          </div>
        )}

        {episode.shots.length === 0 && !isGenerating && (
          <div className="text-center py-24 text-gray-600">
            <p>暂无镜头，请点击上方按钮开始生成第一批次 (1-20镜)</p>
          </div>
        )}

        {episode.shots.length > 0 && (
          <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto pb-10">
            {episode.shots.map((shot, idx) => (
              <div key={idx} className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden flex flex-col lg:flex-row transition-all hover:border-blue-500/30 group shadow-2xl relative">
                <div className="w-full lg:w-80 bg-black p-6 border-r border-white/5 relative aspect-video lg:aspect-square flex flex-col items-center justify-center">
                  <div className="absolute top-4 left-4 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full z-10">
                    镜 #{shot.shotNumber}
                  </div>
                  
                  {/* 单镜重刷按钮 */}
                  <button 
                    onClick={() => handleRegenerateShot(idx)}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-blue-600 text-white rounded-lg transition-colors border border-white/10 group-hover:opacity-100 opacity-0"
                    title="重新生成此镜"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  <div className="text-center">
                    <div className="text-blue-500 text-xl font-black">{shot.shotType}</div>
                    <div className="text-gray-500 text-[10px] font-black border-t border-white/5 pt-2 mt-1 uppercase">{shot.movement}</div>
                  </div>
                </div>
                
                <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-black mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        视觉描述
                      </h4>
                      <p className="text-base text-gray-200 leading-relaxed font-bold">{shot.visualDescription}</p>
                    </div>
                    
                    {shot.dialogue && (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-sm text-white font-medium italic">“{shot.dialogue}”</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black mb-2">Vidu 提示词</h4>
                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 relative">
                      <p className="text-xs text-indigo-300/80 font-mono select-all pr-10">
                        {shot.viduPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 继续生成按钮 */}
            {currentBatch < 2 && !isGenerating && (
              <div className="flex justify-center py-10">
                <button
                  onClick={handleContinue}
                  className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-900/40 transition-all hover:scale-105"
                >
                  满意，继续生成后续 20 个镜头 (第 {currentBatch + 2} 阶段)
                </button>
              </div>
            )}
            
            {isGenerating && currentBatch < 2 && (
              <div className="flex justify-center py-10 text-gray-400 animate-pulse font-bold">
                AI 正在努力拆解下一阶段动作中...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardEditor;
