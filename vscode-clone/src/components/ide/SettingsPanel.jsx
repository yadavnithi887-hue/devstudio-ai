import React, { useState, useEffect } from 'react';
import { Search, Type, Palette, Code, Layout, FileText, Sparkles, Save, AlertTriangle } from 'lucide-react'; // Sparkles added
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

// Settings Data Structure
const settingsSchema = {
  editor: {
    icon: Type,
    label: 'Text Editor',
    items: [
      { id: 'fontSize', label: 'Font Size', type: 'number', desc: 'Controls the font size in pixels.' },
      { id: 'fontFamily', label: 'Font Family', type: 'text', desc: 'Controls the font family.' },
      { id: 'tabSize', label: 'Tab Size', type: 'number', desc: 'The number of spaces a tab is equal to.' },
      { id: 'wordWrap', label: 'Word Wrap', type: 'select', options: ['off', 'on', 'wordWrapColumn', 'bounded'], desc: 'Controls how lines should wrap.' },
      { id: 'cursorBlinking', label: 'Cursor Blinking', type: 'select', options: ['blink', 'smooth', 'phase', 'expand', 'solid'], desc: 'Control the cursor animation style.' },
      { id: 'lineNumbers', label: 'Line Numbers', type: 'select', options: ['on', 'off', 'relative'], desc: 'Control the display of line numbers.' },
    ]
  },
  // 🔥 AI SETTINGS ADDED BACK
  ai: {
    icon: Sparkles,
    label: 'AI Assistant (API)',
    items: [
      { id: 'aiProvider', label: 'AI Provider', type: 'select', options: ['gemini', 'openai', 'openrouter'], desc: 'Select the AI service provider.' },
      { id: 'apiKey', label: 'API Key', type: 'password', desc: 'Your secret API Key (Stored locally).' },
      { id: 'aiModel', label: 'Model Name', type: 'text', desc: 'e.g. gemini-pro, gpt-4, claude-3-opus' },
    ]
  },
  window: {
    icon: Layout,
    label: 'Window',
    items: [
      { id: 'minimap', label: 'Minimap', type: 'toggle', desc: 'Controls whether the minimap is shown.' },
      { id: 'sidebarPosition', label: 'Sidebar Position', type: 'select', options: ['left', 'right'], desc: 'Controls sidebar location.' },
    ]
  },
  files: {
    icon: FileText,
    label: 'Files',
    items: [
      { id: 'autoSave', label: 'Auto Save', type: 'toggle', desc: 'Automatically save files on change.' },
    ]
  }
};

export default function SettingsPanel({ settings, onSettingChange, onSave, unsaved, onViewChange, onDiscardChanges }) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('editor');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingCat, setPendingCat] = useState(null);

  const renderControl = (item) => {
    const val = settings[item.id] || ''; // Default empty if undefined

    if (item.type === 'toggle') {
      return <Switch checked={!!val} onCheckedChange={(c) => onSettingChange(item.id, c)} />;
    }
    
    if (item.type === 'select') {
      return (
        <select 
          value={val} 
          onChange={(e) => onSettingChange(item.id, e.target.value)}
          className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 text-xs outline-none focus:border-[#007acc] w-48"
        >
          {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    
    if (item.type === 'number') {
      return (
        <input 
          type="number" 
          value={val} 
          onChange={(e) => onSettingChange(item.id, parseInt(e.target.value))}
          className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 text-xs w-16 outline-none focus:border-[#007acc]"
        />
      );
    }

    // Text & Password Inputs
    return (
      <input 
        type={item.type === 'password' ? 'password' : 'text'} 
        value={val} 
        onChange={(e) => onSettingChange(item.id, e.target.value)}
        placeholder={item.type === 'password' ? 'sk-...' : ''}
        className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 text-xs w-64 outline-none focus:border-[#007acc]"
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="p-4 border-b border-[#3c3c3c]">
        <h2 className="text-xs uppercase text-[#cccccc] font-bold mb-3">Settings</h2>
        <div className="flex items-center bg-[#252526] border border-[#3c3c3c] rounded px-2">
          <Search size={14} className="text-[#858585]" />
          <input 
            type="text" 
            placeholder="Search settings..." 
            className="bg-transparent border-none outline-none text-sm text-white p-1.5 flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-40 border-r border-[#3c3c3c] bg-[#252526]">
          {Object.entries(settingsSchema).map(([key, cat]) => (
            <div
              key={key}
              onClick={() => {
                if (unsaved && key !== activeCat) {
                  setPendingCat(key);
                  setShowWarning(true);
                } else {
                  setActiveCat(key);
                  onViewChange && onViewChange(key);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-[#2a2d2e] ${activeCat === key ? 'text-white bg-[#37373d] border-l-2 border-[#007acc]' : 'text-[#858585] border-l-2 border-transparent'}`}
            >
              <cat.icon size={14} />
              {cat.label}
            </div>
          ))}
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#3c3c3c] pb-2">
            <h3 className="text-lg font-light">{settingsSchema[activeCat].label}</h3>
            <Button
              onClick={onSave}
              className="bg-[#007acc] hover:bg-[#005a9e] text-white px-4 py-2 text-sm flex items-center gap-2"
              disabled={!unsaved}
            >
              <Save size={14} />
              Save Settings
            </Button>
          </div>
          <div className="space-y-6">
            {settingsSchema[activeCat].items.map(item => (
               <div key={item.id} className="flex flex-col gap-2 pb-4 border-b border-[#3c3c3c]/30 last:border-0">
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#e1e1e1]">{item.label}</label>
                    {renderControl(item)}
                 </div>
                 <p className="text-xs text-[#858585]">{item.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning Modal for Unsaved Changes */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-[#252526] rounded-lg shadow-2xl border border-[#454545] w-[400px] overflow-hidden">
            <div className="p-4">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#ffbd2e]" />
                Unsaved Changes
              </h3>
              <p className="text-[#cccccc] text-sm">
                You have unsaved settings changes. Switching tabs will discard these changes.
                <br />
                Do you want to continue?
              </p>
            </div>

            <div className="flex justify-end gap-2 p-3 bg-[#1e1e1e] border-t border-[#3c3c3c]">
              <Button
                onClick={() => {
                  setShowWarning(false);
                  setPendingCat(null);
                }}
                className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingCat) {
                    setActiveCat(pendingCat);
                    onViewChange && onViewChange(pendingCat);
                    onDiscardChanges && onDiscardChanges();
                  }
                  setShowWarning(false);
                  setPendingCat(null);
                }}
                className="bg-[#ff5f56] hover:bg-[#e54b42] text-white text-xs h-8"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
