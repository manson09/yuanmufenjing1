import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectHubProps {
  projects: Project[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

const ProjectHub: React.FC<ProjectHubProps> = ({ projects, onSelect, onCreate, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreate(projectName.trim());
      setProjectName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">作品管理中心</h1>
            <p className="text-gray-400 text-sm">管理您的多部改编作品进度</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            + 新建改编作品
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-[#141414] border border-white/5 p-6 rounded-2xl hover:border-blue-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{project.name}</h3>
                <button 
                  onClick={() => onDelete(project.id)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-1"
                >
                  删除
                </button>
              </div>
              
              <div className="flex flex-col gap-1 mb-8">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">最后编辑时间</span>
                <span className="text-sm text-gray-300">
                  {new Date(project.lastModified).toLocaleString()}
                </span>
              </div>

              <button 
                onClick={() => onSelect(project.id)}
                className="w-full bg-white/5 group-hover:bg-blue-600 text-gray-300 group-hover:text-white py-3 rounded-xl font-bold transition-all"
              >
                继续改编
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-32 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
              <p className="text-lg">暂无存档项目</p>
              <p className="text-sm">点击右上角按钮开启你的第一个改编作品</p>
            </div>
          )}
        </div>
      </div>

      {/* 新建项目弹窗 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">开启新作品项目</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">项目/小说名称</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="请输入作品名称..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-all"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 text-gray-400 font-bold py-4"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-[2] bg-blue-600 text-white rounded-xl font-bold py-4 hover:bg-blue-700 transition-all"
                >
                  立即创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHub;
