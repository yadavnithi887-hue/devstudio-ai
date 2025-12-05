import React, { useState, useEffect } from 'react';
import { GitBranch, Check, RefreshCw, Upload, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GitPanel() {
  const [loading, setLoading] = useState(false);
  const [isRepo, setIsRepo] = useState(false);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  
  const rootPath = localStorage.getItem('devstudio-last-project');

  // --- 1. Fetch Status ---
  const refreshStatus = async () => {
    if (!rootPath || !window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.getGitStatus(rootPath);
      setIsRepo(result.isRepo);
      setFiles(result.files || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Initial Load
  useEffect(() => {
    refreshStatus();
    // Optional: Auto-refresh every 5 seconds
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [rootPath]);

  // --- 2. Actions ---
  const handleCommit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    const res = await window.electronAPI.gitCommit(rootPath, message);
    if (res.success) {
      toast.success("Committed successfully");
      setMessage('');
      refreshStatus();
    } else {
      toast.error("Commit failed");
    }
    setLoading(false);
  };

  const handlePush = async () => {
    setLoading(true);
    toast.info("Pushing changes...");
    const res = await window.electronAPI.gitPush(rootPath);
    if (res.success) toast.success("Push successful");
    else toast.error("Push failed (Check console/auth)");
    setLoading(false);
  };

  const handlePull = async () => {
    setLoading(true);
    toast.info("Pulling changes...");
    const res = await window.electronAPI.gitPull(rootPath);
    if (res.success) toast.success("Pull successful");
    else toast.error("Pull failed");
    refreshStatus();
    setLoading(false);
  };

  if (!rootPath) return <div className="p-4 text-[#858585] text-xs">No project open.</div>;

  if (!isRepo) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <p className="text-[#cccccc] text-sm mb-2">No Git Repository found.</p>
        <p className="text-[#858585] text-xs">Run 'git init' in terminal to start.</p>
        <Button onClick={refreshStatus} variant="ghost" size="sm" className="mt-4"><RefreshCw size={14}/> Refresh</Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#252526] flex flex-col text-white">
      {/* Header */}
      <div className="p-3 border-b border-[#3c3c3c]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-[#bbbbbb]">Source Control</div>
          <div className="flex items-center gap-1">
            <button onClick={refreshStatus} className={`p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white ${loading ? 'animate-spin' : ''}`} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        
        {/* Commit Box */}
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="w-full h-20 bg-[#3c3c3c] text-white text-sm px-2 py-1.5 rounded outline-none resize-none border border-[#454545] focus:border-[#007acc]"
            onKeyDown={(e) => { if(e.ctrlKey && e.key === 'Enter') handleCommit(); }}
          />
          <Button 
            onClick={handleCommit} 
            disabled={files.length === 0 || !message.trim() || loading}
            className="w-full bg-[#007acc] hover:bg-[#005a9e] h-8 text-xs"
          >
            <Check size={14} className="mr-1" /> Commit
          </Button>
        </div>

        {/* Sync Buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-[#3c3c3c]/50">
          <Button variant="ghost" size="sm" onClick={handlePush} disabled={loading} className="flex-1 h-7 text-xs text-[#cccccc] hover:bg-[#3c3c3c]">
            <Upload size={12} className="mr-1" /> Push
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePull} disabled={loading} className="flex-1 h-7 text-xs text-[#cccccc] hover:bg-[#3c3c3c]">
            <Download size={12} className="mr-1" /> Pull
          </Button>
        </div>
      </div>
      
      {/* Changes List */}
      <div className="flex-1 overflow-y-auto p-0">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#cccccc] bg-[#2a2d2e]">
          CHANGES ({files.length})
        </div>
        
        {files.length === 0 ? (
           <div className="p-4 text-[#858585] text-xs text-center">No changes detected.</div>
        ) : (
           files.map((file, i) => (
             <div key={i} className="flex items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] cursor-pointer group">
               <span className={`text-[10px] font-bold w-4 ${
                 file.status === 'modified' ? 'text-yellow-400' : 
                 file.status === 'untracked' || file.status === 'added' ? 'text-green-400' : 'text-red-400'
               }`}>
                 {file.status === 'modified' ? 'M' : file.status === 'deleted' ? 'D' : 'U'}
               </span>
               <span className={`text-sm truncate ${file.status === 'deleted' ? 'line-through text-[#6e6e6e]' : 'text-[#cccccc]'}`}>
                 {file.path}
               </span>
             </div>
           ))
        )}
      </div>
    </div>
  );
}