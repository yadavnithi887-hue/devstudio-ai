import React, { useState, useEffect } from 'react';
import { 
  Search, Type, Palette, Code, Layout, FileText, 
  Sparkles, Save, User, Puzzle, Power, Info,
  CheckCircle2, XCircle, Book
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { registry } from "@/modules/core/ExtensionRegistry";

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
  // 🔥 New category for managing extensions
  extensionsManage: {
    icon: Puzzle,
    label: 'Extensions Manager',
    items: [] // Custom rendered
  },
  // Extension settings (from enabled extensions)
  extensionSettings: {
    icon: Code,
    label: 'Extension Settings',
    items: []
  },
  accounts: {
    icon: User,
    label: 'Accounts',
    items: []
  }
};

export default function SettingsPanel({ settings, onSave }) {
  const [schema, setSchema] = useState(defaultSchema);
  const [activeCat, setActiveCat] = useState('editor');
  const [localSettings, setLocalSettings] = useState(settings);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [githubUser, setGithubUser] = useState(localStorage.getItem('github_user'));
  
  // 🔥 Extensions state
  const [extensions, setExtensions] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState(null);

  // Sync with parent settings
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // 🔥 Load extensions from registry
  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = () => {
    const allExtensions = registry.getAllExtensions();
    setExtensions(allExtensions);
    
    // Load extension settings
    const extSettings = registry.getSettings();
    setSchema(prev => ({
      ...prev,
      extensionSettings: {
        ...prev.extensionSettings,
        items: extSettings
      }
    }));
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

  // 🔥 Toggle extension enabled/disabled
  const toggleExtension = (extensionId) => {
    const ext = extensions.find(e => e.id === extensionId);
    const newState = !ext.enabled;
    
    registry.setExtensionEnabled(extensionId, newState);
    
    // Reload extensions
    loadExtensions();
    
    toast.success(
      `${ext.name} ${newState ? 'enabled' : 'disabled'}. Reload to apply changes.`,
      {
        action: {
          label: 'Reload',
          onClick: () => window.location.reload()
        }
      }
    );
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

  // 🔥 Render Extensions Manager
  const renderExtensionsManager = () => {
    const filteredExts = search 
      ? extensions.filter(ext => 
          ext.name.toLowerCase().includes(search.toLowerCase()) ||
          ext.description?.toLowerCase().includes(search.toLowerCase())
        )
      : extensions;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#3c3c3c]">
          <div>
            <h3 className="text-sm font-semibold">Installed Extensions</h3>
            <p className="text-xs text-[#858585] mt-1">
              {extensions.filter(e => e.enabled).length} enabled / {extensions.length} total
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="h-7 text-xs bg-[#007acc] hover:bg-[#006bb3]"
          >
            Reload Window
          </Button>
        </div>

        <div className="space-y-2">
          {filteredExts.map(ext => (
            <div
              key={ext.id}
              className={`p-3 rounded-lg border transition ${
                ext.enabled
                  ? 'bg-[#252526] border-[#3c3c3c]'
                  : 'bg-[#1e1e1e] border-[#2d2d2d] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">{ext.name}</h4>
                    {ext.enabled ? (
                      <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-[#858585] mb-2 line-clamp-2">
                    {ext.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-[#666]">
                    <span>v{ext.version || '1.0.0'}</span>
                    {ext.author && <span>• {ext.author}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <Switch
                    checked={ext.enabled}
                    onCheckedChange={() => toggleExtension(ext.id)}
                  />
                  
                  {ext.readme && (
                    <button
                      onClick={() => setSelectedExtension(ext)}
                      className="text-xs text-[#007acc] hover:underline flex items-center gap-1"
                    >
                      <Book size={12} />
                      README
                    </button>
                  )}
                </div>
              </div>

              {/* Extension Settings Count */}
              {ext.settings && ext.settings.length > 0 && ext.enabled && (
                <div className="mt-2 pt-2 border-t border-[#3c3c3c]/50">
                  <p className="text-xs text-[#858585]">
                    {ext.settings.length} setting{ext.settings.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredExts.length === 0 && (
          <div className="text-center py-8">
            <Puzzle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs text-[#666]">No extensions found</p>
          </div>
        )}
      </div>
    );
  };

  // 🔥 Extension README Modal
  const renderExtensionModal = () => {
    if (!selectedExtension) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={() => setSelectedExtension(null)}
      >
        <div 
          className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden m-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-[#3c3c3c] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedExtension.name}</h3>
              <p className="text-xs text-[#858585]">v{selectedExtension.version}</p>
            </div>
            <button
              onClick={() => setSelectedExtension(null)}
              className="text-[#858585] hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <pre className="text-xs text-[#cccccc] whitespace-pre-wrap font-mono">
              {selectedExtension.readme || 'No README available'}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // Filter settings
  const filteredSchema = React.useMemo(() => {
    if (!search) return schema;

    const filtered = {};
    Object.entries(schema).forEach(([key, cat]) => {
      if (key === 'extensionsManage' || key === 'accounts') {
        filtered[key] = cat;
        return;
      }
      
      const filteredItems = cat.items.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.desc?.toLowerCase().includes(search.toLowerCase())
      );
      
      if (filteredItems.length > 0) {
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
            {activeCat !== 'accounts' && activeCat !== 'extensionsManage' && (
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
            {/* 🔥 Extensions Manager View */}
            {activeCat === 'extensionsManage' ? (
              renderExtensionsManager()
            ) : activeCat === 'accounts' ? (
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
                <Info size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs text-[#666]">No settings available in this category</p>
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
                          (extension setting)
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

      {/* 🔥 Extension README Modal */}
      {renderExtensionModal()}
    </div>
  );
}