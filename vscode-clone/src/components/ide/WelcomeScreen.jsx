import React from 'react';
import { FilePlus, FolderOpen, GitBranch, Settings, Command } from 'lucide-react';

export default function WelcomeScreen({ onOpenFolder, onCreateFile, onOpenRecent, recentProjects = [] }) {
  return (
    <div className="flex-1 bg-[#1e1e1e] text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto pt-16 px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Column: Start */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-4xl">⌘</span>
            <h1 className="text-3xl font-light text-white">DevStudio AI</h1>
          </div>

          <h2 className="text-xl font-normal mb-4">Start</h2>
          
          <div className="space-y-2">
            <button onClick={onCreateFile} className="flex items-center gap-3 text-[#3794ff] hover:underline group w-full text-left p-1">
              <FilePlus size={18} className="text-[#cccccc] group-hover:text-[#3794ff]" />
              <span className="text-sm">New File...</span>
            </button>
            
            <button onClick={onOpenFolder} className="flex items-center gap-3 text-[#3794ff] hover:underline group w-full text-left p-1">
              <FolderOpen size={18} className="text-[#cccccc] group-hover:text-[#3794ff]" />
              <span className="text-sm">Open Folder...</span>
            </button>
            
            <button className="flex items-center gap-3 text-[#3794ff] hover:underline group w-full text-left p-1 cursor-not-allowed opacity-70">
              <GitBranch size={18} className="text-[#cccccc]" />
              <span className="text-sm">Clone Git Repository...</span>
            </button>
          </div>

          {/* Recent List (From LocalStorage) */}
          {recentProjects.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-normal mb-4">Recent</h2>
              <div className="space-y-1">
                {recentProjects.map((path, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onOpenRecent(path)}
                    className="group flex flex-col cursor-pointer p-1 hover:bg-[#2a2d2e] rounded transition-colors"
                  >
                    <span className="text-[#3794ff] text-sm group-hover:text-white truncate">
                      {path.split('\\').pop().split('/').pop()}
                    </span>
                    <span className="text-[#858585] text-xs truncate opacity-70">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Walkthrough / Help */}
        <div className="space-y-6">
          <h2 className="text-xl font-normal mb-4">Walkthroughs</h2>
          <div className="space-y-2">
             <div className="p-3 bg-[#252526] hover:bg-[#2a2d2e] cursor-pointer rounded border border-[#3c3c3c]">
                <h3 className="font-medium text-sm text-white mb-1">Get Started with VS Clone</h3>
                <p className="text-xs text-[#858585]">Discover the best features of this editor.</p>
             </div>
             <div className="p-3 bg-[#252526] hover:bg-[#2a2d2e] cursor-pointer rounded border border-[#3c3c3c]">
                <h3 className="font-medium text-sm text-white mb-1">Learn the Fundamentals</h3>
                <p className="text-xs text-[#858585]">Jump right into coding.</p>
             </div>
          </div>

          <h2 className="text-xl font-normal mb-4 mt-8">Help</h2>
          <div className="space-y-2 text-sm text-[#cccccc]">
             <button className="flex items-center gap-2 hover:text-[#3794ff] w-full text-left p-1">
                <Settings size={16} /> Printable keyboard cheatsheet
             </button>
             <button className="flex items-center gap-2 hover:text-[#3794ff] w-full text-left p-1">
                <Command size={16} /> Introductory videos
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}