import React, { useState, useEffect } from 'react';
import { 
  Search, Sparkles, Globe, Zap, MessageSquare, Download, 
  CheckCircle2, Power, Settings, Book, ExternalLink, Star,
  TrendingUp, Package, Filter, Grid, List
} from 'lucide-react';
import { registry } from "@/modules/core/ExtensionRegistry";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Icon mapping for extensions
const getExtensionIcon = (iconName) => {
  const icons = {
    sparkles: Sparkles,
    globe: Globe,
    zap: Zap,
    messagesquare: MessageSquare,
    package: Package,
  };
  return icons[iconName?.toLowerCase()] || Package;
};

export default function ExtensionsPanel({ onSelectExtension }) {
  const [extensions, setExtensions] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, enabled, disabled
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedExt, setSelectedExt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = () => {
    const allExtensions = registry.getAllExtensions();
    setExtensions(allExtensions);
  };

  const toggleExtension = (extensionId) => {
    const ext = extensions.find(e => e.id === extensionId);
    if (!ext) return;
    
    const newState = !ext.enabled;
    registry.setExtensionEnabled(extensionId, newState);
    loadExtensions();
  };

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = !search || 
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'enabled' && ext.enabled) ||
      (filter === 'disabled' && !ext.enabled);
    
    return matchesSearch && matchesFilter;
  });

  const enabledCount = extensions.filter(e => e.enabled).length;

  const handleExtensionClick = (ext) => {
    setSelectedExt(ext);
    setShowDetails(true);
    if (onSelectExtension) onSelectExtension(ext);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="p-4 border-b border-[#3c3c3c]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase text-[#ccc]">Extensions</h2>
            <p className="text-xs text-[#858585] mt-1">
              {enabledCount} enabled • {extensions.length} installed
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1.5 rounded hover:bg-[#2d2d2d] transition"
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex bg-[#252526] rounded px-2 border border-[#3c3c3c]">
            <Search size={14} className="text-[#858585] my-auto" />
            <input
              className="bg-transparent border-none text-sm p-1.5 flex-1 outline-none text-white"
              placeholder="Search extensions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 text-xs">
          {['all', 'enabled', 'disabled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded transition capitalize",
                filter === f 
                  ? "bg-[#007acc] text-white" 
                  : "bg-[#2d2d2d] text-[#858585] hover:bg-[#3c3c3c]"
              )}
            >
              {f}
              {f === 'enabled' && ` (${enabledCount})`}
              {f === 'disabled' && ` (${extensions.length - enabledCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Extensions List/Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredExtensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package size={48} className="text-[#454545] mb-3" />
            <p className="text-sm text-[#858585] mb-1">No extensions found</p>
            <p className="text-xs text-[#666]">
              {search ? 'Try a different search term' : 'Install extensions to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredExtensions.map(ext => {
              const Icon = getExtensionIcon(ext.icon);
              
              return (
                <div
                  key={ext.id}
                  className={cn(
                    "group relative p-4 rounded-lg border transition cursor-pointer",
                    ext.enabled 
                      ? "bg-[#252526] border-[#3c3c3c] hover:border-[#007acc]" 
                      : "bg-[#1a1a1a] border-[#2d2d2d] opacity-70 hover:opacity-100"
                  )}
                  onClick={() => handleExtensionClick(ext)}
                >
                  {/* Extension Icon & Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                      ext.enabled ? "bg-[#007acc]/20" : "bg-[#2d2d2d]"
                    )}>
                      <Icon size={24} className={ext.enabled ? "text-[#007acc]" : "text-[#666]"} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{ext.name}</h3>
                        {ext.enabled && (
                          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-[#858585] line-clamp-2 mb-2">
                        {ext.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-[#666]">
                        <span className="flex items-center gap-1">
                          v{ext.version || '1.0.0'}
                        </span>
                        {ext.author && (
                          <>
                            <span>•</span>
                            <span>{ext.author}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtension(ext.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Switch checked={ext.enabled} />
                    </div>
                  </div>

                  {/* Extension Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#666] border-t border-[#3c3c3c]/50 pt-3">
                    {ext.settings && ext.settings.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Settings size={12} />
                        {ext.settings.length} {ext.settings.length === 1 ? 'setting' : 'settings'}
                      </span>
                    )}
                    
                    {ext.readme && (
                      <span className="flex items-center gap-1">
                        <Book size={12} />
                        Documentation
                      </span>
                    )}

                    {ext.enabled && (
                      <span className="flex items-center gap-1 text-green-400 ml-auto">
                        <Power size={12} />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                    {ext.readme && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExtensionClick(ext);
                        }}
                        className="p-1.5 bg-[#2d2d2d] rounded hover:bg-[#3c3c3c] transition"
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredExtensions.map(ext => {
              const Icon = getExtensionIcon(ext.icon);
              
              return (
                <div
                  key={ext.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer",
                    ext.enabled 
                      ? "bg-[#252526] border-[#3c3c3c] hover:border-[#007acc]" 
                      : "bg-[#1a1a1a] border-[#2d2d2d] opacity-70 hover:opacity-100"
                  )}
                  onClick={() => handleExtensionClick(ext)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded flex items-center justify-center flex-shrink-0",
                    ext.enabled ? "bg-[#007acc]/20" : "bg-[#2d2d2d]"
                  )}>
                    <Icon size={20} className={ext.enabled ? "text-[#007acc]" : "text-[#666]"} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm truncate">{ext.name}</h3>
                      {ext.enabled && <CheckCircle2 size={12} className="text-green-400" />}
                    </div>
                    <p className="text-xs text-[#858585] truncate">
                      {ext.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[#666]">v{ext.version || '1.0.0'}</span>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      toggleExtension(ext.id);
                    }}>
                      <Switch checked={ext.enabled} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#3c3c3c] bg-[#252526]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#858585]">
            <Package size={14} />
            <span>Manage your extensions from Settings</span>
          </div>
          
          <Button
            onClick={() => window.location.reload()}
            className="h-7 text-xs bg-[#007acc] hover:bg-[#006bb3]"
          >
            Reload Window
          </Button>
        </div>
      </div>

      {/* Extension Details Modal */}
      {showDetails && selectedExt && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden m-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#3c3c3c]">
              <div className="flex items-start gap-4">
                {(() => {
                  const Icon = getExtensionIcon(selectedExt.icon);
                  return (
                    <div className="w-16 h-16 rounded-lg bg-[#007acc]/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={32} className="text-[#007acc]" />
                    </div>
                  );
                })()}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedExt.name}</h2>
                    {selectedExt.enabled ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[#858585] mb-3">
                    {selectedExt.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-[#666]">
                    <span>v{selectedExt.version || '1.0.0'}</span>
                    {selectedExt.author && (
                      <>
                        <span>•</span>
                        <span>{selectedExt.author}</span>
                      </>
                    )}
                    {selectedExt.settings && selectedExt.settings.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{selectedExt.settings.length} settings</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#858585] hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {selectedExt.readme ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="text-xs text-[#cccccc] whitespace-pre-wrap bg-[#252526] p-4 rounded border border-[#3c3c3c]">
                    {selectedExt.readme}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book size={48} className="mx-auto mb-4 text-[#454545]" />
                  <p className="text-[#858585]">No documentation available for this extension.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#3c3c3c] flex gap-3 justify-end">
              <Button
                onClick={() => {
                  toggleExtension(selectedExt.id);
                  setShowDetails(false);
                }}
                className={cn(
                  "h-9 text-sm",
                  selectedExt.enabled 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-green-500 hover:bg-green-600"
                )}
              >
                {selectedExt.enabled ? 'Disable' : 'Enable'} Extension
              </Button>
              
              <Button
                onClick={() => setShowDetails(false)}
                className="h-9 text-sm bg-[#3c3c3c] hover:bg-[#454545]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}