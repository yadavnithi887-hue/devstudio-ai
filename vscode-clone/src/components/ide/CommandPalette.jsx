import React, { useState, useEffect, useRef } from 'react';
import { Search, File, Settings, Terminal, Sparkles, FolderPlus, FilePlus, Save, X, GitBranch, Play, Keyboard, HelpCircle, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const commands = [
  { id: 'newFile', label: 'File: New File', shortcut: 'Ctrl+N', icon: FilePlus, category: 'File' },
  { id: 'newFolder', label: 'File: New Folder', shortcut: 'Ctrl+Shift+N', icon: FolderPlus, category: 'File' },
  { id: 'save', label: 'File: Save', shortcut: 'Ctrl+S', icon: Save, category: 'File' },
  { id: 'saveAll', label: 'File: Save All', shortcut: 'Ctrl+Shift+S', icon: Save, category: 'File' },
  { id: 'closeEditor', label: 'View: Close Editor', shortcut: 'Ctrl+W', icon: X, category: 'View' },
  { id: 'closeAll', label: 'View: Close All Editors', shortcut: '', icon: X, category: 'View' },
  { id: 'toggleSidebar', label: 'View: Toggle Sidebar', shortcut: 'Ctrl+B', icon: Settings, category: 'View' },
  { id: 'toggleTerminal', label: 'View: Toggle Terminal', shortcut: 'Ctrl+`', icon: Terminal, category: 'View' },
  { id: 'toggleAI', label: 'View: Toggle AI Assistant', shortcut: 'Ctrl+I', icon: Sparkles, category: 'View' },
  { id: 'openSettings', label: 'Preferences: Open Settings', shortcut: 'Ctrl+,', icon: Settings, category: 'Preferences' },
  { id: 'shortcuts', label: 'Preferences: Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', icon: Keyboard, category: 'Preferences' },
  { id: 'changeTheme', label: 'Preferences: Color Theme', shortcut: 'Ctrl+K Ctrl+T', icon: Palette, category: 'Preferences' },
  { id: 'goToFile', label: 'Go to File...', shortcut: 'Ctrl+P', icon: File, category: 'Go' },
  { id: 'goToLine', label: 'Go to Line...', shortcut: 'Ctrl+G', icon: File, category: 'Go' },
  { id: 'goToSymbol', label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', icon: File, category: 'Go' },
  { id: 'gitCommit', label: 'Git: Commit', shortcut: '', icon: GitBranch, category: 'Git' },
  { id: 'gitPush', label: 'Git: Push', shortcut: '', icon: GitBranch, category: 'Git' },
  { id: 'gitPull', label: 'Git: Pull', shortcut: '', icon: GitBranch, category: 'Git' },
  { id: 'startDebugging', label: 'Debug: Start Debugging', shortcut: 'F5', icon: Play, category: 'Debug' },
  { id: 'help', label: 'Help: Welcome', shortcut: '', icon: HelpCircle, category: 'Help' },
  { id: 'about', label: 'Help: About', shortcut: '', icon: HelpCircle, category: 'Help' },
];

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;
  
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      onAction(filteredCommands[selectedIndex].id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-xl bg-[#252526] rounded-lg shadow-2xl border border-[#454545] overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3c3c3c]">
          <Search size={16} className="text-[#858585]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#858585]"
          />
          <kbd className="text-[10px] bg-[#3c3c3c] text-[#858585] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        
        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#858585] text-sm">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  onAction(cmd.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                  idx === selectedIndex ? "bg-[#094771]" : "hover:bg-[#2a2d2e]"
                )}
              >
                <cmd.icon size={16} className="text-[#858585] flex-shrink-0" />
                <span className="flex-1 text-sm text-[#cccccc]">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="text-[10px] bg-[#3c3c3c] text-[#858585] px-1.5 py-0.5 rounded">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-[#3c3c3c] text-[10px] text-[#858585] flex items-center gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}