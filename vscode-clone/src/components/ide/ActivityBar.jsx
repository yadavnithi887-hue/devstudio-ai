import React from 'react';
import { Files, Search, GitBranch, Bug, Blocks, Settings, Sparkles, MessageSquare, Globe, PanelLeftClose, PanelLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  { id: 'explorer', icon: Files, label: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search', icon: Search, label: 'Search (Ctrl+Shift+F)' },
  { id: 'git', icon: GitBranch, label: 'Source Control (Ctrl+Shift+G)' },
  { id: 'debug', icon: Bug, label: 'Run and Debug (Ctrl+Shift+D)' },
  { id: 'extensions', icon: Blocks, label: 'Extensions (Ctrl+Shift+X)' },
];

const bottomActivities = [
  { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

// Extension icons mapping
const extensionIcons = {
  'web-preview': { icon: Globe, label: 'Web Preview' },
};

export default function ActivityBar({ activeView, setActiveView, aiOpen, setAiOpen, installedExtensions = [], onExtensionClick, sidebarOpen = true, onToggleSidebar, onOpenSettings }) {
  // Get installed extension buttons
  const extensionButtons = installedExtensions
    .filter(extId => extensionIcons[extId])
    .map(extId => ({
      id: extId,
      ...extensionIcons[extId]
    }));

  const handleActivityClick = (itemId) => {
    // Special case for settings - open modal instead of sidebar
    if (itemId === 'settings') {
      onOpenSettings?.();
      return;
    }

    // Scenario 1: अगर यूजर उसी बटन पर क्लिक कर रहा है जो पहले से खुला है
    if (activeView === itemId) {
      // तो बस साइडबार को खोलो या बंद करो (Toggle)
      onToggleSidebar();
    }
    // Scenario 2: अगर यूजर किसी दूसरे बटन पर क्लिक कर रहा है (जैसे Explorer से Search पर गया)
    else {
      // पहले व्यू बदलो
      setActiveView(itemId);
      // और अगर साइडबार बंद पड़ा है, तो उसे जबरदस्ती खोलो
      if (!sidebarOpen) {
        onToggleSidebar();
      }
    }
  };

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-1 border-r border-[#252526]">
      <div className="flex-1 flex flex-col gap-0.5">
        {activities.map((item) => (
          <button
            key={item.id}
            onClick={() => handleActivityClick(item.id)}
            className={cn(
              "w-12 h-12 flex items-center justify-center relative group transition-colors",
              activeView === item.id && sidebarOpen
                ? "text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-white" 
                : "text-[#858585] hover:text-white"
            )}
          >
            <item.icon size={24} />
            <span className="absolute left-14 bg-[#252526] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
              {item.label}
            </span>
          </button>
        ))}
        
        {/* Installed Extension Icons */}
        {extensionButtons.length > 0 && (
          <>
            <div className="w-8 h-px bg-[#454545] my-2 mx-auto" />
            {extensionButtons.map((ext) => (
              <button
                key={ext.id}
                onClick={() => onExtensionClick?.(ext.id)}
                className="w-12 h-12 flex items-center justify-center relative group transition-colors text-[#858585] hover:text-white"
                title={ext.label}
              >
                <ext.icon size={24} />
                <span className="absolute left-14 bg-[#252526] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
                  {ext.label}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
      
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className={cn(
            "w-12 h-12 flex items-center justify-center relative group transition-colors",
            aiOpen 
              ? "text-[#007acc]" 
              : "text-[#858585] hover:text-white"
          )}
        >
          <Sparkles size={24} />
          <span className="absolute left-14 bg-[#252526] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
            AI Assistant (Ctrl+I)
          </span>
        </button>
        {bottomActivities.slice(1).map((item) => (
          <button
            key={item.id}
            onClick={() => handleActivityClick(item.id)}
            className={cn(
              "w-12 h-12 flex items-center justify-center relative group transition-colors",
              activeView === item.id && sidebarOpen
                ? "text-white" 
                : "text-[#858585] hover:text-white"
            )}
          >
            <item.icon size={24} />
            <span className="absolute left-14 bg-[#252526] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}