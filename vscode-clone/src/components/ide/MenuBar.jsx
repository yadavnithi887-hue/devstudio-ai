import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const menuItems = {
  File: [
    { label: 'New Text File', shortcut: 'Ctrl+N', action: 'newFile' },
    { label: 'New File...', action: 'newFile' },
    { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: 'newWindow', comingSoon: true },
    { type: 'separator' },
    { label: 'Open File...', shortcut: 'Ctrl+O', action: 'openFile', comingSoon: true },
    { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: 'openFolder' }, // यह चल रहा है
    { label: 'Open Recent', action: 'openRecent', comingSoon: true },
    { type: 'separator' },
    { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'saveAs', comingSoon: true },
    { label: 'Save All', action: 'saveAll' },
    { type: 'separator' },
    { label: 'Auto Save', action: 'autoSave', toggle: true },
    { label: 'Preferences', action: 'viewSettings' }, // Settings यहाँ डाल दिया
    { type: 'separator' },
    { label: 'Close Editor', shortcut: 'Ctrl+F4', action: 'closeEditor' },
    { label: 'Close Folder', shortcut: 'Ctrl+K F', action: 'closeFolder' }, // 🔥 यह जोड़ दिया
    { label: 'Close Window', shortcut: 'Alt+F4', action: 'closeWindow' },   // 🔥 यह जोड़ दिया
    { type: 'separator' },
    { label: 'Exit', action: 'quit' }
  ],
  // ... बाकी Edit, View, etc. पुराने वाले ही रहने दें ...
  Edit: [
     { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
     { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
     { type: 'separator' },
     { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
     { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
     { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
  ],
  View: [
     { label: 'Command Palette', shortcut: 'Ctrl+Shift+P', action: 'commandPalette' },
     { type: 'separator' },
     { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: 'viewExplorer' },
     { label: 'Terminal', shortcut: 'Ctrl+`', action: 'viewTerminal' },
  ],
  Help: [
     { label: 'Welcome', action: 'welcome' },
     { label: 'About', action: 'about' },
  ]
};

export default function MenuBar({ onAction, settings, onSettingToggle }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };
  
  const handleItemClick = (item) => {
    if (item.comingSoon) {
      onAction('showComingSoon', item.label);
    } else if (item.toggle) {
      onSettingToggle(item.action);
    } else {
      onAction(item.action);
    }
    setActiveMenu(null);
  };
  
  return (
    <div ref={menuRef} className="flex items-center gap-1">
      {Object.entries(menuItems).map(([menuName, items]) => (
        <div key={menuName} className="relative">
          <button
            onClick={() => handleMenuClick(menuName)}
            onMouseEnter={() => activeMenu && setActiveMenu(menuName)}
            className={cn(
              "px-2 py-1 text-xs rounded hover:bg-white/10",
              activeMenu === menuName ? "bg-white/10" : ""
            )}
          >
            {menuName}
          </button>
          
          {activeMenu === menuName && (
            <div className="absolute top-full left-0 mt-0.5 bg-[#252526] border border-[#454545] rounded shadow-xl min-w-56 py-1 z-50">
              {items.map((item, idx) => (
                item.type === 'separator' ? (
                  <div key={idx} className="h-px bg-[#454545] my-1" />
                ) : (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#094771]",
                      item.comingSoon ? "text-[#6e6e6e]" : "text-[#cccccc]"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {item.toggle && (
                        <span className={cn(
                          "w-3 h-3 border rounded-sm flex items-center justify-center",
                          settings?.[item.action] ? "bg-[#007acc] border-[#007acc]" : "border-[#6e6e6e]"
                        )}>
                          {settings?.[item.action] && <span className="text-white text-[8px]">✓</span>}
                        </span>
                      )}
                      {item.label}
                      {item.comingSoon && (
                        <span className="text-[10px] bg-[#3c3c3c] px-1.5 py-0.5 rounded text-[#858585]">
                          Coming Soon
                        </span>
                      )}
                    </span>
                    {item.shortcut && (
                      <span className="text-[#6e6e6e] ml-4">{item.shortcut}</span>
                    )}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}