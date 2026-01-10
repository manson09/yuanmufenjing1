import React, { useState } from 'react';
import { Episode, Shot, KBFile } from '../types';
import { generateStoryboard } from '../services/geminiService';

interface StoryboardEditorProps {
  episode: Episode;
  kb: KBFile[];
  onUpdate: (updates: Partial<Episode>) => void;
  onBack: () => void;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ episode, kb, onUpdate, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const shots = await generateStoryboard(episode, kb);
      onUpdate({ shots, status: 'completed' });
    } catch (err) {
      setError('生成失败。请确保剧本内容有足够的动作节点，或尝试分段生成。');
      console.error(err);
    } finally {
      setIsGenerating(false);
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
              {episode.shots.length > 0 && <span className="ml-3 px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded uppercase border border-indigo-600/30 font-black">60+ 高密度模式</span>}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500 font-bold">累计镜头数：{episode.shots.length}</span>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[10px] text-blue-500 uppercase font-black tracking-tighter">原子化拆解已激活</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {episode.shots.length > 0 && (
            <button
              onClick={exportToWord}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl flex items-center space-x-2 transition-all text-xs font-black shadow-lg shadow-indigo-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>导出专业 Word 表格</span>
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
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">时空拆解计算中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">{episode.shots.length > 0 ? '重新生成（重置）' : '开始智能分镜生成'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-24 h-24 mb-10 relative">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">执行 60+ 镜头高密度重组</h3>
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-blue-400 font-bold">
                  <span>{"动作原子化拆解 (挥拳 -> 瞳孔 -> 击中)"}</span>
                  <span className="animate-pulse">处理中...</span>
                </div>
                <div className="flex justify-between items-center text-indigo-400 font-bold">
                  <span>{"情绪对峙拉长 (眼神 -> 汗滴 -> 武器颤动)"}</span>
                  <span className="animate-pulse">处理中...</span>
                </div>
                <div className="flex justify-between items-center text-green-400 font-bold">
                  <span>{"系统/环境特效注入 (UI -> 金光 -> 气旋)"}</span>
                  <span className="animate-pulse">处理中...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isGenerating && episode.shots.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="w-32 h-32 bg-[#141414] rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
              <svg className="w-14 h-14 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">分镜序列未初始化</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
              点击上方按钮开始生成。系统将锁定 1:1 台词，通过“动作原子化”和“系统特效化”确保生成 60 个以上的高密度镜头。
            </p>
          </div>
        )}

        {!isGenerating && episode.shots.length > 0 && (
          <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto pb-20">
            {episode.shots.map((shot, idx) => (
              <div key={idx} className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden flex flex-col lg:flex-row transition-all hover:border-blue-500/30 group shadow-2xl relative">
                <div className="w-full lg:w-80 bg-black p-6 border-r border-white/5 relative aspect-video lg:aspect-square flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute top-4 left-4 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg tracking-widest uppercase">
                    镜 #{shot.shotNumber}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/5 text-[10px] px-3 py-1 rounded-lg backdrop-blur-xl border border-white/10 font-black text-gray-400">
                    {shot.duration}
                  </div>
                  
                  <div className="text-center relative z-10">
                    <div className="text-blue-500 text-xl font-black tracking-tighter mb-1 uppercase group-hover:scale-110 transition-transform duration-500">{shot.shotType}</div>
                    <div className="text-gray-500 text-[10px] font-black tracking-widest border-t border-white/5 pt-2 mt-1 uppercase">{shot.movement}</div>
                  </div>
                </div>
                
                <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-black mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        视觉描述 (原子化拆解)
                      </h4>
                      <p className="text-base text-gray-200 leading-relaxed font-bold">{shot.visualDescription}</p>
                    </div>
                    
                    {shot.dialogue && (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-black mb-1">1:1 原著台词</h4>
                        <p className="text-sm text-white font-medium italic">“{shot.dialogue}”</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black mb-2">Vidu 一致性视听提示词</h4>
                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 group-hover:border-indigo-500/30 transition-all relative">
                      <p className="text-xs text-indigo-300/80 font-mono leading-relaxed select-all">
                        {shot.viduPrompt}
                      </p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(shot.viduPrompt)}
                        className="absolute right-3 top-3 p-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white bg-[#0a0a0a] rounded-xl border border-white/10"
                        title="点击复制"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardEditor;
