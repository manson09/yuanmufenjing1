import React, { useState, useEffect } from 'react'; // ✨ 确保引入了 useEffect
import { Episode, Shot, KBFile, ScriptStyle } from '../types';
import { generateStoryboard, regenerateSingleShot } from '../services/storyboardService';

interface StoryboardEditorProps {
  episode: Episode;
  kb: KBFile[];
  onUpdate: (updates: Partial<Episode>) => void;
  onBack: () => void;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode, kb, onUpdate, onBack }) => {
  // --- 状态管理 ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0); 
  const [selectedStyle, setSelectedStyle] = useState<ScriptStyle>('情绪流');

  // ✨ 本地存储唯一 ID
  const storageId = `storyboard_${episode.title}`;

  // ✨ 修改：由云端保存改为本地浏览器保存
  const saveToCloud = async (shots: Shot[]) => {
    try {
      localStorage.setItem(storageId, JSON.stringify(shots));
      console.log("💾 进度已同步至本地存储");
    } catch (err) {
      console.error("存档失败:", err);
    }
  };

  // ✨ 修改：由云端恢复改为从本地浏览器恢复进度
  useEffect(() => {
    const loadSavedWork = async () => {
      if (episode.shots && episode.shots.length > 0) return;
      try {
        const savedDataRaw = localStorage.getItem(storageId);
        if (savedDataRaw) {
          const savedData = JSON.parse(savedDataRaw);
          if (savedData && savedData.length > 0) {
            onUpdate({ 
              shots: savedData, 
              status: savedData.length >= 50 ? 'completed' : 'generating' 
            });
            setCurrentBatch(Math.floor(savedData.length / 20) - 1);
            console.log("✅ 已恢复历史进度");
          }
        }
      } catch (e) {
        console.log("本地暂无存档");
      }
    };
    loadSavedWork();
  }, [episode.title, storageId, onUpdate]);

  // 1. 初始生成逻辑
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const shots = await generateStoryboard(episode, kb, selectedStyle);
      onUpdate({ shots, status: 'generating' });
      setCurrentBatch(0);
      // ✨ 自动保存
      await saveToCloud(shots);
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
      const moreShots = await generateStoryboard(episode, kb, selectedStyle);
      const updatedShots = [...episode.shots, ...moreShots];
      onUpdate({ 
        shots: updatedShots, 
        status: nextBatch === 2 ? 'completed' : 'generating' 
      });
      setCurrentBatch(nextBatch);
      // ✨ 自动保存
      await saveToCloud(updatedShots);
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
      const newShot = await regenerateSingleShot(episode, kb, target, prev);
      const updatedShots = [...episode.shots];
      updatedShots[index] = newShot;
      onUpdate({ shots: updatedShots });
      // ✨ 自动保存
      await saveToCloud(updatedShots);
    } catch (err) {
      alert('重刷该镜头失败');
    }
  };

  // 4. 导出 Word 逻辑（完整保留）
  const exportToWord = () => {
    if (!episode.shots || episode.shots.length === 0) {
      alert("没有可导出的分镜数据");
      return;
    }

    const tableRows = episode.shots.map(s => `
      <tr style="background-color: ${s.shotNumber % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
        <td style="border: 1px solid #dddddd; padding: 10px; text-align: center; font-weight: bold; font-size: 10pt;">${s.shotNumber}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; text-align: center; font-size: 10pt;">${s.duration || '3s'}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; color: #2563eb; font-weight: bold; font-size: 10pt;">${s.shotType} / ${s.movement}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; font-size: 10.5pt; line-height: 1.5;">${s.visualDescription}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; font-style: italic; color: #4b5563; font-size: 10pt;">${s.dialogue || '-'}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; font-size: 9pt; font-family: 'Courier New', monospace; color: #4f46e5; background-color: #f5f7ff;">${s.viduPrompt}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>专业分镜表 - ${episode.title}</title>
        <style>
          body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; border: 1px solid #333; }
          th { background-color: #1e293b; color: #ffffff; border: 1px solid #333; padding: 12px; text-align: center; font-size: 11pt; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1e293b; padding-bottom: 10px; }
          .title { font-size: 22pt; font-weight: bold; color: #1e293b; margin: 0; }
          .meta { margin-top: 10px; font-size: 10pt; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">专业动画分镜脚本 (Vidu 深度拆解版)</p>
          <div class="meta">剧本标题：${episode.title} | 导出时间：${new Date().toLocaleString()} | 镜头总数：${episode.shots.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 6%;">镜号</th>
              <th style="width: 6%;">时长</th>
              <th style="width: 13%;">视听语言</th>
              <th style="width: 28%;">画面视觉描述</th>
              <th style="width: 15%;">原著台词/OS</th>
              <th style="width: 32%;">Vidu 提示词</th>
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
    link.download = `${episode.title}_专业分镜脚本.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      {/* Header 部分 */}
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
              {episode.shots.length > 0 && (
                <span className="ml-3 px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded uppercase border border-indigo-600/30 font-black">
                  50-60 镜深度拆解模式
                </span>
              )}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500 font-bold">创作进度：{episode.shots.length} 镜 (目标 50-60 镜)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 mx-4">
          {['情绪流', '非情绪流'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStyle(s as ScriptStyle)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedStyle === s
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s}模式
            </button>
          ))}
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
              isGenerating ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-500 shadow-blue-900/40'
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

      {/* 主体内容滚动区 */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center space-x-3">
            <span>{error}</span>
          </div>
        )}

        {isGenerating && episode.shots.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold tracking-widest text-blue-500 uppercase text-xs">正在执行【{selectedStyle}】原子化拆解...</p>
          </div>
        )}

        {episode.shots.length === 0 && !isGenerating && (
          <div className="text-center py-24 text-gray-600 flex flex-col items-center">
            <div className="mb-4 opacity-20">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-bold">当前模式：{selectedStyle}</p>
            <p className="text-sm mt-2">准备就绪，请点击上方按钮开始生成</p>
          </div>
        )}

        {episode.shots.length > 0 && (
          <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto pb-10">
            {episode.shots.map((shot, idx) => (
              <div key={idx} className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden flex flex-col lg:flex-row transition-all hover:border-blue-500/30 group shadow-2xl relative">
                <div className="w-full lg:w-80 bg-black p-6 border-r border-white/5 relative aspect-video lg:aspect-square flex flex-col items-center justify-center">
                  <div className="absolute top-4 left-4 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg shadow-blue-900/40">
                    镜 #{shot.shotNumber}
                  </div>
                  
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
                    <div className="text-blue-500 text-xl font-black tracking-tighter">{shot.shotType}</div>
                    <div className="text-gray-500 text-[10px] font-black border-t border-white/5 pt-2 mt-1 uppercase tracking-widest">{shot.movement}</div>
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
                        <p className="text-sm text-white/80 font-medium italic">“{shot.dialogue}”</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black mb-2">Vidu 提示词</h4>
                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 relative group/prompt">
                      <p className="text-xs text-indigo-300/80 font-mono select-all pr-10 leading-relaxed">
                        {shot.viduPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {currentBatch < 2 && !isGenerating && (
              <div className="flex justify-center py-10">
                <button
                  onClick={handleContinue}
                  className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-900/40 transition-all hover:scale-105"
                >
                  继续生成后续镜头 (阶段 {currentBatch + 2} / 3)
                </button>
              </div>
            )}
            
            {isGenerating && currentBatch < 2 && (
              <div className="flex justify-center py-10 text-gray-400 animate-pulse font-bold">
                AI 正在以【{selectedStyle}】拆解下一阶段中...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardEditor;
