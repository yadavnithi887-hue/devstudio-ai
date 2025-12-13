import React from 'react';
import { 
  Files, Search, GitBranch, Bug, Blocks, Settings, 
  Sparkles, Box, Terminal, Globe, User, Zap, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🔥 Comprehensive Icon Mapper
const getIcon = (name) => {
  const iconMap = {
    // Extension icons
    sparkles: Sparkles,
    zap: Zap,
    box: Box,
    terminal: Terminal,
    globe: Globe,
    user: User,
    settings: Settings,
    messagesquare: MessageSquare,
    bot: MessageSquare, // Fallback for bot
    
    // Additional icons
    files: Files,
    search: Search,
    git: GitBranch,
    debug: Bug,
    extensions: Blocks,
  };
  
  const iconName = name?.toLowerCase() || '';
  return iconMap[iconName] || Blocks; // Default to Blocks if not found
};

// ✅ UPDATED Props
export default function ActivityBar({ 
  activeView, 
  setActiveView, 
  sidebarOpen, 
  onToggleSidebar, 
  onOpenSettings, 
  extensionItems = [],
  // ✅ ADDED New Props
  aiPanelOpen,
  onToggleAIPanel
}) {
  // Core activities (always visible)
  const activities = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Bug, label: 'Run & Debug' },
    { id: 'extensions', icon: Blocks, label: 'Extensions' },
  ];

  const handleActivityClick = (itemId) => {
    if (activeView === itemId) {
      onToggleSidebar();
    } else {
      setActiveView(itemId);
      if (!sidebarOpen) onToggleSidebar();
    }
  };

  const handleExtClick = (item) => {
    if (item.onClick) {
      // Custom click handler
      item.onClick();
    } else {
      // Default behavior: open in sidebar
      setActiveView(item.id);
      if (!sidebarOpen) onToggleSidebar();
    }
  };

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-2 border-r border-[#252526] z-20 flex-shrink-0">
      {/* Top section for Core & Extension Activities */}
      <div className="flex flex-col gap-2">
        {activities.map((item) => (
          <button
            key={item.id}
            onClick={() => handleActivityClick(item.id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1",
              activeView === item.id && sidebarOpen
                ? "text-white border-l-2 border-white bg-[#2a2d2e]"
                : "text-[#858585] hover:text-white"
            )}
            title={item.label}
          >
            <item.icon size={24} strokeWidth={1.5} />
            
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d30] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-[#454545]">
              {item.label}
            </div>
          </button>
        ))}
        
        {extensionItems.length > 0 && (
          <div className="h-px bg-[#454545] w-6 mx-auto my-1" />
        )}
        
        {extensionItems.map((item) => {
          const Icon = getIcon(item.icon);
          
          return (
            <button
              key={item.id}
              onClick={() => handleExtClick(item)}
              className={cn(
                "w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1",
                activeView === item.id && sidebarOpen
                  ? "text-white border-l-2 border-white bg-[#2a2d2e]"
                  : "text-[#858585] hover:text-white"
              )}
              title={item.label}
            >
              <Icon size={24} strokeWidth={1.5} />
              
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d30] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-[#454545]">
                {item.label}
                {item.extensionId && (
                  <div className="text-[10px] text-[#858585] mt-0.5">
                    Extension
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Spacer to push next items to the bottom */}
      <div className="flex-1" />
      
      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 pb-2">
        {/* ✅ ADDED: Animated AI Icon Button */}
        <button
          onClick={onToggleAIPanel}
          className={cn(
            "w-12 h-12 flex items-center justify-center hover:bg-[#2d2d2d] transition-colors relative group",
            aiPanelOpen && "bg-[#2d2d2d] border-l-2 border-purple-500"
          )}
          title="AI Coding Assistant (Ctrl+Shift+I)"
        >
          <div className="relative">
            {/* Pulse animation when active */}
            {aiPanelOpen && (
              <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-ping" />
            )}
            
            {/* Icon */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              className={cn(
                "relative z-10 transition-all duration-300",
                aiPanelOpen ? "text-purple-400 scale-110" : "text-gray-400"
              )}
            >
              {/* AI Chip/Brain Icon */}
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 2v2M16 2v2M8 20v2M16 20v2M2 8h2M2 16h2M20 8h2M20 16h2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <path d="M9 12h6M12 9v6" stroke="#1e1e1e" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d30] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-[#454545]">
            AI Assistant
          </div>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-10 h-10 flex items-center justify-center relative group transition-colors rounded-md mx-1 text-[#858585] hover:text-white"
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
          
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d30] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-[#454545]">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
}