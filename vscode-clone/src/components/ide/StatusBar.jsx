import React from 'react';
import { GitBranch, AlertCircle, CheckCircle, Bell, Settings, Wifi, Eye, EyeOff, Terminal, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatusBar({ 
  activeFile, 
  cursorPosition, 
  previewOpen, 
  onTogglePreview,
  terminalOpen,
  onToggleTerminal 
}) {
  const getLanguage = (filename) => {
    if (!filename) return 'Plain Text';
    const ext = filename.split('.').pop()?.toLowerCase();
    const languages = {
      js: 'JavaScript',
      jsx: 'JavaScript React',
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      css: 'CSS',
      html: 'HTML',
      json: 'JSON',
      md: 'Markdown',
      py: 'Python',
      java: 'Java',
    };
    return languages[ext] || 'Plain Text';
  };
  
  return (
    <div className="h-6 bg-[#007acc] text-white text-xs flex items-center justify-between px-2 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <CheckCircle size={12} />
          <span>0</span>
          <AlertCircle size={12} className="ml-1" />
          <span>0</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Toggle buttons */}
        <button
          onClick={onToggleTerminal}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded transition-colors",
            terminalOpen ? "bg-white/20" : "hover:bg-white/10"
          )}
          title="Toggle Terminal (Ctrl+`)"
        >
          <Terminal size={12} />
          <span className="hidden sm:inline">Terminal</span>
        </button>
        
        <button
          onClick={onTogglePreview}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded transition-colors",
            previewOpen ? "bg-white/20" : "hover:bg-white/10"
          )}
          title="Toggle Preview"
        >
          {previewOpen ? <Eye size={12} /> : <EyeOff size={12} />}
          <span className="hidden sm:inline">Preview</span>
        </button>
        
        <div className="w-px h-4 bg-white/20 mx-1" />
        
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          Ln {cursorPosition?.line || 1}, Col {cursorPosition?.column || 1}
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer hidden sm:block">
          Spaces: 2
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer hidden sm:block">
          UTF-8
        </span>
        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          {getLanguage(activeFile?.name)}
        </span>
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <Wifi size={12} />
        </div>
      </div>
    </div>
  );
}