import React from 'react';
import { Files, Search, GitBranch, Bug, Blocks, Settings, Sparkles, Box, Terminal, Globe, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon Mapper
const getIcon = (name) => {
  const map = { sparkles: Sparkles, zap: Zap, box: Box, terminal: Terminal, globe: Globe, user: User, settings: Settings };
  return map[name.toLowerCase()] || Blocks;
};

export default function ActivityBar({ activeView, setActiveView, sidebarOpen, onToggleSidebar, onOpenSettings, extensionItems = [] }) {
  const activities = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Bug, label: 'Run & Debug' },
    { id: 'extensions', icon: Blocks, label: 'Extensions' },
  ];

  const handleActivityClick = (itemId) => {
    if (activeView === itemId) onToggleSidebar();
    else { setActiveView(itemId); if (!sidebarOpen) onToggleSidebar(); }
  };

  const handleExtClick = (item) => {
    if (item.onClick) item.onClick();
    else { setActiveView(item.id); if (!sidebarOpen) onToggleSidebar(); }
  };

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-2 border-r border-[#252526] z-20 flex-shrink-0">
      <div className="flex-1 flex flex-col gap-2">
        {activities.map((item) => (
          <button key={item.id} onClick={() => handleActivityClick(item.id)} className={cn("w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1", activeView === item.id && sidebarOpen ? "text-white border-l-2 border-white bg-[#2a2d2e]" : "text-[#858585] hover:text-white")} title={item.label}>
            <item.icon size={24} strokeWidth={1.5} />
          </button>
        ))}
        
        {extensionItems.length > 0 && <div className="h-px bg-[#454545] w-6 mx-auto my-1"/>}
        
        {extensionItems.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <button key={item.id} onClick={() => handleExtClick(item)} className={cn("w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1", activeView === item.id && sidebarOpen ? "text-white border-l-2 border-white bg-[#2a2d2e]" : "text-[#858585] hover:text-white")} title={item.label}>
                <Icon size={24} strokeWidth={1.5} />
              </button>
            );
        })}
      </div>
      
      <div className="flex flex-col gap-2 pb-2">
        <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1 text-[#858585] hover:text-white" title="Settings"><Settings size={24} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}