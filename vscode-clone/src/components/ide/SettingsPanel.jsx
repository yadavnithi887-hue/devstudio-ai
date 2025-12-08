import React, { useState, useEffect } from 'react';
import { Search, Type, Palette, Code, Layout, FileText, Sparkles, Save, User, Puzzle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { registry } from "@/modules/core/ExtensionRegistry";

// Default Schema
const defaultSchema = {
  editor: {
    icon: Type,
    label: 'Text Editor',
    items: [
      { id: 'fontSize', label: 'Font Size', type: 'number', desc: 'Controls the font size in pixels.', default: 14 },
      { id: 'fontFamily', label: 'Font Family', type: 'text', desc: 'Controls the font family.', default: "'Cascadia Code', monospace" },
      { id: 'tabSize', label: 'Tab Size', type: 'number', desc: 'The number of spaces a tab is equal to.', default: 2 },
      { id: 'wordWrap', label: 'Word Wrap', type: 'select', options: ['off', 'on'], desc: 'Controls how lines should wrap.', default: 'off' },
      { id: 'lineNumbers', label: 'Line Numbers', type: 'select', options: ['on', 'off', 'relative'], desc: 'Control the display of line numbers.', default: 'on' },
    ]
  },
  ai: {
    icon: Sparkles,
    label: 'AI Assistant',
    items: [
      { id: 'aiProvider', label: 'AI Provider', type: 'select', options: ['gemini', 'openai', 'openrouter'], desc: 'Select the AI service provider.', default: 'gemini' },
      { id: 'aiModel', label: 'AI Model', type: 'text', desc: 'Model name to use', default: 'gemini-pro' },
    ]
  },
  window: {
    icon: Layout,
    label: 'Window',
    items: [
      { id: 'minimap', label: 'Minimap', type: 'toggle', desc: 'Controls whether the minimap is shown.', default: true },
    ]
  },
  files: {
    icon: FileText,
    label: 'Files',
    items: [
      { id: 'autoSave', label: 'Auto Save', type: 'toggle', desc: 'Automatically save files on change.', default: false },
    ]
  },
  // 🔥 New Categories for Extensions
  themes: {
    icon: Palette,
    label: 'Themes',
    items: [] // Will be populated by extensions
  },
  extensions: {
    icon: Puzzle,
    label: 'Extensions',
    items: [] // Will be populated by extensions
  },
  accounts: {
    icon: User,
    label: 'Accounts',
    items: [] // Custom rendered
  }
};

export default function SettingsPanel({ settings, onSave }) {
  const [schema, setSchema] = useState(defaultSchema);
  const [activeCat, setActiveCat] = useState('editor');
  const [localSettings, setLocalSettings] = useState(settings);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // GitHub State
  const [githubUser, setGithubUser] = useState(localStorage.getItem('github_user'));

  // Sync with parent settings
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // 🔥 Load dynamic settings from registry
  useEffect(() => {
    const extSettings = registry.getSettings();
    // Inhe apne schema state me merge karna hoga
    setSchema((prev) => {
      const newSchema = { ...prev };
      // Clear existing extension items
      newSchema.themes.items = [];
      newSchema.extensions.items = [];
      // Add extension settings
      extSettings.forEach((item) => {
        const section = item.section || 'extensions';
        // Map to our schema format
        const settingItem = {
          id: item.id,
          label: item.label,
          type: item.type || 'text',
          desc: item.description || '',
          default: item.default,
          options: item.options,
          extensionId: item.extensionId
        };
        // Add to appropriate section
        if (section === 'theme') {
          newSchema.themes.items.push(settingItem);
        } else {
          newSchema.extensions.items.push(settingItem);
        }
      });
      return newSchema;
    });
  }, []);

  // 🔥 Load Extension UI Registry on Mount
  useEffect(() => {
    if (window.electronAPI) {
      // Get initial registry
      window.electronAPI.getExtensionUIRegistry().then((registry) => {
        if (registry) {
          updateSchemaFromRegistry(registry);
        }
      });

      // Listen for registry updates
      const cleanup = window.electronAPI.onExtensionUIRegistryUpdate((registry) => {
        updateSchemaFromRegistry(registry);
      });

      return () => cleanup();
    }
  }, []);

  // 🔥 Update Schema from Extension Registry
  const updateSchemaFromRegistry = (registry) => {
    setSchema((prev) => {
      const newSchema = { ...prev };
      
      // Clear existing extension items
      newSchema.themes.items = [];
      newSchema.extensions.items = [];

      // Add extension settings
      if (registry.settingsPanelItems) {
        registry.settingsPanelItems.forEach((item) => {
          const section = item.section || 'extensions';
          
          // Map to our schema format
          const settingItem = {
            id: item.id,
            label: item.label,
            type: item.type || 'text',
            desc: item.description || '',
            default: item.default,
            options: item.options,
            extensionId: item.extensionId
          };

          // Add to appropriate section
          if (section === 'theme') {
            if (!newSchema.themes.items.find(i => i.id === item.id)) {
              newSchema.themes.items.push(settingItem);
            }
          } else {
            if (!newSchema.extensions.items.find(i => i.id === item.id)) {
              newSchema.extensions.items.push(settingItem);
            }
          }
        });
      }

      return newSchema;
    });
  };

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localSettings);
    setHasChanges(false);
    toast.success("Settings saved!");
  };

  const renderControl = (item) => {
    const val = localSettings[item.id] !== undefined 
      ? localSettings[item.id] 
      : (item.default !== undefined ? item.default : '');

    if (item.type === 'toggle') {
      return (
        <Switch 
          checked={!!val} 
          onCheckedChange={c => handleChange(item.id, c)} 
        />
      );
    }
    
    if (item.type === 'number') {
      return (
        <input 
          type="number" 
          value={val} 
          onChange={e => handleChange(item.id, parseInt(e.target.value) || 0)} 
          className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 w-20 outline-none focus:border-[#007acc]" 
        />
      );
    }
    
    if (item.type === 'select') {
      return (
        <select 
          value={val} 
          onChange={e => handleChange(item.id, e.target.value)}
          className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 outline-none focus:border-[#007acc]"
        >
          {item.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (item.type === 'color') {
      return (
        <input 
          type="color" 
          value={val || '#000000'} 
          onChange={e => handleChange(item.id, e.target.value)}
          className="bg-[#3c3c3c] border border-[#454545] rounded px-1 py-1 w-16 cursor-pointer"
        />
      );
    }
    
    return (
      <input 
        type={item.type === 'password' ? 'password' : 'text'} 
        value={val} 
        onChange={e => handleChange(item.id, e.target.value)} 
        className="bg-[#3c3c3c] text-white border border-[#454545] rounded px-2 py-1 w-full outline-none focus:border-[#007acc]" 
        placeholder={item.desc} 
      />
    );
  };

  // Filter settings based on search
  const filteredSchema = React.useMemo(() => {
    if (!search) return schema;
    
    const filtered = {};
    Object.entries(schema).forEach(([key, cat]) => {
      const filteredItems = cat.items.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.desc?.toLowerCase().includes(search.toLowerCase())
      );
      if (filteredItems.length > 0 || key === 'accounts') {
        filtered[key] = { ...cat, items: filteredItems };
      }
    });
    return filtered;
  }, [schema, search]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="p-4 border-b border-[#3c3c3c]">
        <h2 className="text-xs font-bold uppercase mb-3 text-[#ccc]">Settings</h2>
        <div className="flex bg-[#252526] rounded px-2 border border-[#3c3c3c]">
          <Search size={14} className="text-[#858585] my-auto" />
          <input 
            className="bg-transparent border-none text-sm p-1.5 flex-1 outline-none text-white" 
            placeholder="Search settings..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-[#3c3c3c] bg-[#252526] overflow-y-auto">
          {Object.entries(filteredSchema).map(([key, cat]) => (
            <div 
              key={key} 
              onClick={() => setActiveCat(key)} 
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-[#2a2d2e] transition ${
                activeCat === key 
                  ? 'text-white bg-[#37373d] border-l-2 border-[#007acc]' 
                  : 'text-[#858585] border-l-2 border-transparent'
              }`}
            >
              <cat.icon size={14} /> {cat.label}
            </div>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-2 mb-4">
            <h3 className="text-lg">{filteredSchema[activeCat]?.label}</h3>
            {activeCat !== 'accounts' && (
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges}
                className={`h-7 text-xs transition ${
                  hasChanges 
                    ? 'bg-[#007acc] hover:bg-[#006bb3]' 
                    : 'bg-[#3c3c3c] opacity-50 cursor-not-allowed'
                }`}
              >
                <Save size={12} className="mr-1" />
                Save Settings
              </Button>
            )}
          </div>
          
          <div className="space-y-6">
            {activeCat === 'accounts' ? (
              <div className="p-4 bg-[#252526] rounded border border-[#3c3c3c]">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <User size={16} /> GitHub
                </h4>
                {githubUser ? (
                  <p className="text-xs text-green-400">✓ Connected as {githubUser}</p>
                ) : (
                  <p className="text-xs text-gray-500">Not connected. Use Source Control panel to sign in.</p>
                )}
              </div>
            ) : filteredSchema[activeCat]?.items.length === 0 ? (
              <div className="text-center py-8">
                <Puzzle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs text-[#666]">
                  {activeCat === 'themes' 
                    ? 'No theme extensions installed. Install theme extensions to customize your editor appearance.' 
                    : 'No extension settings available.'}
                </p>
              </div>
            ) : (
              filteredSchema[activeCat]?.items.map(item => (
                <div 
                  key={item.id} 
                  className="flex flex-col gap-1 pb-4 border-b border-[#3c3c3c]/30"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[#e1e1e1]">
                      {item.label}
                      {item.extensionId && (
                        <span className="ml-2 text-[10px] text-[#858585] font-normal">
                          (from extension)
                        </span>
                      )}
                    </label>
                    {renderControl(item)}
                  </div>
                  {item.desc && (
                    <p className="text-xs text-[#858585]">{item.desc}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}