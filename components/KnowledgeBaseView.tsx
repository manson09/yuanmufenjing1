import React, { useState } from 'react';
import { KBFile } from '../types';

interface KnowledgeBaseViewProps {
  files: KBFile[];
  onAdd: (file: KBFile) => void;
  onRemove: (id: string) => void;
}

// 智能读取文件内容，自动处理 UTF-8 和 GBK 编码
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve("");
        return;
      }
      
      // 1. 优先尝试 UTF-8 (Strict)
      // 如果文件不是有效的 UTF-8，这里会报错，然后进入 catch 块尝试 GBK
      try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const text = decoder.decode(buffer);
        resolve(text);
        return;
      } catch (e) {
        // UTF-8 解析失败，说明可能包含非 UTF-8 字符
      }

      // 2. 尝试 GBK (常用于中文 Windows 环境的文本文件)
      try {
        const decoder = new TextDecoder('gbk', { fatal: true });
        const text = decoder.decode(buffer);
        resolve(text);
        return;
      } catch (e) {
        // GBK 也失败了
      }
      
      // 3. 兜底策略：使用宽松的 UTF-8 (Lenient)
      // 这可能会显示乱码符号，但至少能读出部分内容，不会崩坏
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        resolve(text);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ files, onAdd, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Cast to File[] to handle TypeScript FileList inference
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    
    for (const file of droppedFiles) {
      try {
        const content = await readFileContent(file);
        onAdd({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type || 'text/plain',
          content,
          uploadDate: Date.now()
        });
      } catch (err) {
        console.error("无法读取文件:", file.name, err);
        alert(`文件 ${file.name} 读取失败，请检查文件格式。`);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cast to File[] to handle TypeScript FileList inference
    const selectedFiles = Array.from(e.target.files || []) as File[];
    for (const file of selectedFiles) {
      try {
        const content = await readFileContent(file);
        onAdd({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type || 'text/plain',
          content,
          uploadDate: Date.now()
        });
      } catch (err) {
        console.error("无法读取文件:", file.name, err);
      }
    }
    // 重置 input，允许重复上传同名文件
    e.target.value = '';
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">原著知识库</h2>
        <p className="text-gray-400">上传角色设定、场景描写、物理规则文件。AI 将以此作为视觉与内容锚点。</p>
      </header>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center text-center ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'
        }`}
      >
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-lg font-medium text-white mb-1">拖拽文件到此处上传</p>
        <p className="text-gray-500 text-sm">支持 TXT, JSON, MD 等格式（自动识别 UTF-8/GBK 编码）</p>
        <input 
          type="file" 
          multiple 
          onChange={handleFileInput}
          className="hidden" 
          id="fileInput" 
        />
        <label 
          htmlFor="fileInput"
          className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-all"
        >
          或者点击上传
        </label>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map(file => (
          <div key={file.id} className="bg-white/5 border border-white/5 rounded-xl p-6 relative group">
            <button 
              onClick={() => onRemove(file.id)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1 truncate pr-6">{file.name}</h3>
            <p className="text-xs text-gray-500 uppercase">{file.type.split('/')[1] || 'text'}</p>
            <div className="mt-4 text-sm text-gray-400 line-clamp-3">
              {file.content}
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-600">
            暂无知识库文件，请先上传以供 AI 参考。
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseView;