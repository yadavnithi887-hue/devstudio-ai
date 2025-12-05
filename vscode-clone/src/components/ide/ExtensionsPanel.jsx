import React, { useState } from 'react';
import { Search, Check, Download, Star, Eye, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const availableExtensions = [
  {
    id: 'web-preview',
    name: 'Web Preview',
    description: 'Live preview for HTML, CSS & JavaScript web applications. See your changes in real-time.',
    author: 'DevStudio',
    version: '1.0.0',
    downloads: '10K+',
    rating: 4.8,
    icon: '🌐',
    category: 'Preview',
    installed: false,
  },
  {
    id: 'prettier',
    name: 'Prettier - Code Formatter',
    description: 'Automatic code formatting for JavaScript, TypeScript, CSS, HTML and more.',
    author: 'Prettier',
    version: '2.8.0',
    downloads: '50K+',
    rating: 4.9,
    icon: '✨',
    category: 'Formatter',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'eslint',
    name: 'ESLint',
    description: 'Find and fix problems in your JavaScript code.',
    author: 'ESLint',
    version: '3.0.0',
    downloads: '45K+',
    rating: 4.7,
    icon: '🔍',
    category: 'Linter',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'git-lens',
    name: 'GitLens',
    description: 'Supercharge Git within VS Code. Visualize code authorship, navigate repos, and more.',
    author: 'GitKraken',
    version: '14.0.0',
    downloads: '30K+',
    rating: 4.8,
    icon: '🔀',
    category: 'Git',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'auto-rename',
    name: 'Auto Rename Tag',
    description: 'Automatically rename paired HTML/XML tags.',
    author: 'Jun Han',
    version: '0.1.10',
    downloads: '25K+',
    rating: 4.6,
    icon: '🏷️',
    category: 'Productivity',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'bracket-pair',
    name: 'Bracket Pair Colorizer',
    description: 'Colorize matching brackets for easier code reading.',
    author: 'CoenraadS',
    version: '2.0.0',
    downloads: '20K+',
    rating: 4.5,
    icon: '🌈',
    category: 'Visual',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'live-server',
    name: 'Live Server',
    description: 'Launch a local development server with live reload feature.',
    author: 'Ritwick Dey',
    version: '5.7.0',
    downloads: '40K+',
    rating: 4.9,
    icon: '🚀',
    category: 'Server',
    installed: false,
    comingSoon: true,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Rich Python language support including IntelliSense, linting, debugging.',
    author: 'Microsoft',
    version: '2023.0',
    downloads: '60K+',
    rating: 4.8,
    icon: '🐍',
    category: 'Language',
    installed: false,
    comingSoon: true,
  },
];

export default function ExtensionsPanel({ installedExtensions, onInstall, onUninstall }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [selectedExtension, setSelectedExtension] = useState(null);
  
  const filteredExtensions = availableExtensions.filter(ext => 
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const installed = availableExtensions.filter(ext => installedExtensions.includes(ext.id));
  const displayList = activeTab === 'installed' ? installed : filteredExtensions;
  
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={10} 
        className={cn(
          i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-[#6e6e6e]"
        )} 
      />
    ));
  };
  
  return (
    <div className="h-full bg-[#252526] flex flex-col">
      <div className="p-3 border-b border-[#3c3c3c]">
        <div className="text-xs uppercase tracking-wider text-[#bbbbbb] mb-3">Extensions</div>
        
        <div className="flex items-center bg-[#3c3c3c] rounded overflow-hidden mb-3">
          <Search size={14} className="text-[#858585] ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className="flex-1 bg-transparent text-white text-sm px-2 py-1.5 outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              "px-3 py-1 text-xs rounded",
              activeTab === 'available' ? "bg-[#007acc] text-white" : "bg-[#3c3c3c] text-[#cccccc]"
            )}
          >
            Available
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={cn(
              "px-3 py-1 text-xs rounded",
              activeTab === 'installed' ? "bg-[#007acc] text-white" : "bg-[#3c3c3c] text-[#cccccc]"
            )}
          >
            Installed ({installed.length})
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {displayList.map((ext) => (
          <div
            key={ext.id}
            onClick={() => setSelectedExtension(ext)}
            className={cn(
              "p-3 border-b border-[#3c3c3c] cursor-pointer hover:bg-[#2a2d2e]",
              selectedExtension?.id === ext.id && "bg-[#2a2d2e]"
            )}
          >
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-[#3c3c3c] rounded-lg flex items-center justify-center text-2xl">
                {ext.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm truncate">{ext.name}</span>
                  {ext.comingSoon && (
                    <span className="text-[9px] bg-[#3c3c3c] px-1.5 py-0.5 rounded text-[#858585]">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#858585] truncate mt-0.5">{ext.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6e6e6e]">
                  <span>{ext.author}</span>
                  <span className="flex items-center gap-0.5">
                    {renderStars(ext.rating)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={10} />
                    {ext.downloads}
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                {installedExtensions.includes(ext.id) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onUninstall(ext.id); }}
                    className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Uninstall
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onInstall(ext.id); }}
                    disabled={ext.comingSoon}
                    className={cn(
                      "h-7 text-xs",
                      ext.comingSoon 
                        ? "bg-[#3c3c3c] text-[#6e6e6e] cursor-not-allowed" 
                        : "bg-[#007acc] hover:bg-[#006bb3]"
                    )}
                  >
                    {ext.comingSoon ? 'Coming Soon' : 'Install'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {displayList.length === 0 && (
          <div className="p-8 text-center text-[#6e6e6e] text-sm">
            {activeTab === 'installed' ? 'No extensions installed' : 'No extensions found'}
          </div>
        )}
      </div>
      
      {/* Extension Details */}
      {selectedExtension && (
        <div className="border-t border-[#3c3c3c] p-4 bg-[#1e1e1e]">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 bg-[#3c3c3c] rounded-lg flex items-center justify-center text-3xl">
              {selectedExtension.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{selectedExtension.name}</h3>
              <p className="text-xs text-[#858585] mt-1">{selectedExtension.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#6e6e6e]">
                <span>v{selectedExtension.version}</span>
                <span>{selectedExtension.category}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}