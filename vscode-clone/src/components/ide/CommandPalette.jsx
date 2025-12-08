import React, { useState, useEffect, useRef } from 'react';
import { Search, File, Settings, Terminal, Sparkles, FolderPlus, FilePlus, Save, X, GitBranch, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { registry } from '@/modules/core/ExtensionRegistry';

const staticCommands = [
  { id: 'newFile', label: 'File: New File', icon: FilePlus, category: 'File' },
  { id: 'openFolder', label: 'File: Open Folder', icon: FolderPlus, category: 'File' },
  { id: 'save', label: 'File: Save', icon: Save, category: 'File' },
  { id: 'toggleTerminal', label: 'View: Toggle Terminal', icon: Terminal, category: 'View' },
  { id: 'openSettings', label: 'Preferences: Open Settings', icon: Settings, category: 'Preferences' },
];

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allCommands, setAllCommands] = useState(staticCommands);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      const extCommandsMap = registry.getCommands();
      const extCommandsList = Array.from(extCommandsMap.keys()).map(cmdId => ({
        id: cmdId,
        label: `Ext: ${cmdId.replace('.', ': ')}`,
        icon: Sparkles,
        category: 'Extension'
      }));
      setAllCommands([...staticCommands, ...extCommandsList]);
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  
  const filteredCommands = allCommands.filter(cmd =>
      cmd.label.toLowerCase().includes(query.toLowerCase())
  );
  
  const handleSelect = (id) => {
    if (registry.getCommands().has(id)) {
        registry.executeCommand(id);
    } else {
        onAction(id);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, filteredCommands.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter' && filteredCommands[selectedIndex]) { e.preventDefault(); handleSelect(filteredCommands[selectedIndex].id); }
    else if (e.key === 'Escape') { onClose(); }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#252526] rounded-lg shadow-2xl border border-[#454545] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3c3c3c]">
          <Search size={16} className="text-[#858585]" />
          <input
            ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#858585]"
            autoComplete="off"
          />
        </div>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {filteredCommands.map((cmd, idx) => (
            <div key={cmd.id} onClick={() => handleSelect(cmd.id)} onMouseEnter={() => setSelectedIndex(idx)} className={cn("flex items-center gap-3 px-3 py-2 cursor-pointer", idx === selectedIndex ? "bg-[#094771]" : "hover:bg-[#2a2d2e]")}>
              <cmd.icon size={16} className="text-[#858585] flex-shrink-0" />
              <span className="flex-1 text-sm text-[#cccccc]">{cmd.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}