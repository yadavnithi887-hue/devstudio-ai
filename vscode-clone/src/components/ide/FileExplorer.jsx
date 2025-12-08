import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronDown, FilePlus, FolderPlus, Edit3, Trash2, Copy,
  RefreshCw, FolderOpen, Folder, File, Search, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getIconUrl } from '@/lib/fileIcons';

// --- Icon Component ---
const FileIcon = ({ filename, isFolder, isOpen }) => {
  const iconUrl = getIconUrl(filename || '', isFolder, isOpen);

  return (
    <img
      src={iconUrl}
      alt=""
      className="w-4 h-4 flex-shrink-0 mr-2 select-none"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'block';
      }}
    />
  );
};

// --- Helper: Path Normalizer ---
const cleanPath = (p) => {
  if (!p || p === 'root') return '';
  return p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
};

// --- Inline Input (IMPROVED) ---
const InlineInput = ({ type, onComplete, onCancel }) => {
  const [val, setVal] = useState('');
  const ref = useRef(null);

  useEffect(() => { 
    if(ref.current) {
      ref.current.focus();
      ref.current.select(); // 🔥 Select all text
    }
  }, []);

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && val.trim()) {
      onComplete(val.trim());
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  // 🔥 Click outside to cancel
  const handleBlur = (e) => {
    // Small delay to allow Enter key to work first
    setTimeout(() => {
      if (val.trim()) {
        onComplete(val.trim());
      } else {
        onCancel();
      }
    }, 100);
  };

  return (
    <div className="flex items-center py-1 px-2" style={{ paddingLeft: '22px' }}>
      <span className="mr-2">
        {type === 'folder' ? <Folder size={16} className="text-blue-400"/> : <File size={16} className="text-gray-400"/>}
      </span>
      <input
        ref={ref} 
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="bg-[#1e1e1e] text-white border border-[#007acc] text-[13px] h-6 outline-none w-full px-1 rounded"
        onClick={(e) => e.stopPropagation()}
        placeholder={type === 'folder' ? 'Folder name...' : 'File name...'}
      />
    </div>
  );
};

// --- FILE ITEM (IMPROVED) ---
const FileItem = ({ file, depth, activeFile, onFileClick, renamingId, setRenamingId, onRenameFile, onDeleteFile }) => {
  const [newName, setNewName] = useState(file.name);
  const inputRef = useRef(null);
  const isRenaming = renamingId === file.id;

  useEffect(() => { 
    if (isRenaming) {
      setNewName(file.name);
      // 🔥 Auto focus and select when renaming starts
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isRenaming, file.name]);

  const submitRename = () => {
    if (newName.trim() && newName !== file.name) {
      onRenameFile(file, newName);
    }
    setRenamingId(null);
  };

  // 🔥 Click outside to cancel
  const handleBlur = () => {
    setTimeout(() => {
      if (newName.trim() && newName !== file.name) {
        submitRename();
      } else {
        setRenamingId(null);
      }
    }, 100);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] select-none text-[#cccccc] transition-colors",
            activeFile?.id === file.id && "bg-[#37373d] text-white"
          )}
          style={{ paddingLeft: '24px' }}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isRenaming) onFileClick(file); 
          }}
        >
          <FileIcon filename={file.name} isFolder={false} />
          <File className="w-4 h-4 mr-2 text-gray-400 hidden" />

          {isRenaming ? (
            <input 
              ref={inputRef}
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              onBlur={handleBlur}
              onKeyDown={(e) => { 
                e.stopPropagation(); 
                if (e.key === 'Enter') submitRename(); 
                if (e.key === 'Escape') setRenamingId(null); 
              }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-[#1e1e1e] text-white px-1 outline-none border border-[#007acc] h-5 text-xs flex-1 rounded" 
            />
          ) : (
            <span className="text-[13px] truncate flex-1 select-none">{file.name}</span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[#252526] border-[#454545] text-white w-48">
        <ContextMenuItem onClick={() => setRenamingId(file.id)} className="text-xs">
          <Edit3 size={14} className="mr-2"/> Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDeleteFile(file)} className="text-red-400 text-xs">
          <Trash2 size={14} className="mr-2"/> Delete
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#454545]"/>
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(file.realPath)} className="text-xs">
          <Copy size={14} className="mr-2"/> Copy Path
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// --- Folder Item (IMPROVED) ---
const FolderItem = ({ 
  folder, 
  expandedFolders, 
  toggleFolder, 
  onCreateFile, 
  onCreateFolder, 
  renamingId, 
  setRenamingId, 
  onRenameFolder, 
  onDeleteFolder, 
  renderTree, 
  startCreation 
}) => {
  const [newName, setNewName] = useState(folder.name);
  const inputRef = useRef(null);
  const isExpanded = expandedFolders[folder.path];
  const isRenaming = renamingId === folder.path;

  useEffect(() => { 
    if (isRenaming) {
      setNewName(folder.name);
      // 🔥 Auto focus and select
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isRenaming, folder.name]);

  const submitRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRenameFolder(folder, newName);
    }
    setRenamingId(null);
  };

  // 🔥 Click outside to cancel
  const handleBlur = () => {
    setTimeout(() => {
      if (newName.trim() && newName !== folder.name) {
        submitRename();
      } else {
        setRenamingId(null);
      }
    }, 100);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] select-none text-[#cccccc] transition-colors group"
            style={{ paddingLeft: '4px' }}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isRenaming) toggleFolder(folder.path); 
            }}
          >
            <span className="mr-1 flex-shrink-0">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>

            <FileIcon filename={folder.name} isFolder={true} isOpen={isExpanded} />
            <Folder className="w-4 h-4 mr-2 text-blue-400 hidden" />

            {isRenaming ? (
              <input 
                ref={inputRef}
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                onBlur={handleBlur}
                onKeyDown={(e) => { 
                  e.stopPropagation(); 
                  if (e.key === 'Enter') submitRename(); 
                  if (e.key === 'Escape') setRenamingId(null); 
                }} 
                onClick={(e) => e.stopPropagation()} 
                className="bg-[#1e1e1e] text-white px-1 outline-none border border-[#007acc] h-5 text-xs flex-1 rounded" 
              />
            ) : (
              <span className="text-[13px] truncate select-none flex-1">{folder.name}</span>
            )}

            {/* 🔥 Quick actions on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreation('file', folder.path);
                }}
                className="p-1 hover:bg-[#3c3c3c] rounded"
                title="New File"
              >
                <FilePlus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreation('folder', folder.path);
                }}
                className="p-1 hover:bg-[#3c3c3c] rounded"
                title="New Folder"
              >
                <FolderPlus size={12} />
              </button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#252526] border-[#454545] text-white w-48">
          <ContextMenuItem onClick={() => startCreation('file', folder.path)} className="text-xs">
            <FilePlus size={14} className="mr-2"/> New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => startCreation('folder', folder.path)} className="text-xs">
            <FolderPlus size={14} className="mr-2"/> New Folder
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[#454545]"/>
          <ContextMenuItem onClick={() => setRenamingId(folder.path)} className="text-xs">
            <Edit3 size={14} className="mr-2"/> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDeleteFolder(folder)} className="text-red-400 text-xs">
            <Trash2 size={14} className="mr-2"/> Delete
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[#454545]"/>
          <ContextMenuItem onClick={() => navigator.clipboard.writeText(folder.realPath || folder.path)} className="text-xs">
            <Copy size={14} className="mr-2"/> Copy Path
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && (
        <div className="ml-3 pl-1 border-l border-white/10">
          {renderTree(folder.path)}
        </div>
      )}
    </div>
  );
};

// --- Main Explorer (IMPROVED) ---
const FileExplorer = ({ 
  files = [], 
  folders = [], 
  activeFile, 
  onFileClick, 
  onCreateFile, 
  onCreateFolder, 
  onDeleteFile, 
  onDeleteFolder, 
  onRenameFile, 
  onRenameFolder,
  projectName, 
  onOpenFolder 
}) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [creationState, setCreationState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Auto expand src folder
  useEffect(() => {
    const src = folders.find(f => f.name === 'src');
    if(src) {
      setExpandedFolders(prev => ({...prev, [src.path]: true}));
    }
  }, [folders.length]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // 🔥 Collapse all folders
  const collapseAll = () => {
    setExpandedFolders({});
  };

  // 🔥 Expand all folders
  const expandAll = () => {
    const allPaths = {};
    folders.forEach(f => {
      allPaths[f.path] = true;
    });
    setExpandedFolders(allPaths);
  };

  const startCreation = (type, parentPath) => {
    const cleanedPath = cleanPath(parentPath);
    
    if (cleanedPath) {
      setExpandedFolders(prev => ({ ...prev, [cleanedPath]: true }));
    } else {
      setProjectExpanded(true);
    }
    
    setCreationState({ 
      type, 
      parentPath: cleanedPath 
    });
  };

  const handleCreationComplete = (name) => {
    if (!creationState) return;
    
    if (creationState.type === 'file') {
      onCreateFile({ 
        name, 
        folder: creationState.parentPath 
      });
    } else {
      onCreateFolder({ 
        name, 
        folder: creationState.parentPath 
      });
    }
    setCreationState(null);
  };

  const sortItems = (items) => {
    return items.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  };

  // 🔥 Search/Filter logic
  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderTree = (parentPath) => {
    const normParent = cleanPath(parentPath);
    
    let childFolders = folders.filter(f => {
      const p = cleanPath(f.path);
      if (!p.startsWith(normParent + '/')) return false;
      return !p.slice(normParent.length + 1).includes('/');
    });
    
    let childFiles = files.filter(f => cleanPath(f.folder) === normParent);

    // Apply search filter
    childFolders = filterItems(sortItems(childFolders));
    childFiles = filterItems(sortItems(childFiles));

    return (
      <>
        {creationState && creationState.parentPath === normParent && (
          <InlineInput 
            type={creationState.type} 
            onComplete={handleCreationComplete} 
            onCancel={() => setCreationState(null)} 
          />
        )}
        
        {childFolders.map(folder => (
          <FolderItem 
            key={folder.path} 
            folder={folder} 
            expandedFolders={expandedFolders} 
            toggleFolder={toggleFolder}
            onCreateFile={onCreateFile} 
            onCreateFolder={onCreateFolder}
            renamingId={renamingId} 
            setRenamingId={setRenamingId}
            onRenameFolder={onRenameFolder} 
            onDeleteFolder={onDeleteFolder}
            renderTree={renderTree} 
            startCreation={startCreation}
          />
        ))}
        
        {childFiles.map(file => (
          <FileItem 
            key={file.id} 
            file={file} 
            depth={0} 
            activeFile={activeFile}
            onFileClick={onFileClick} 
            renamingId={renamingId} 
            setRenamingId={setRenamingId}
            onRenameFile={onRenameFile} 
            onDeleteFile={onDeleteFile}
          />
        ))}
      </>
    );
  };

  // Root items
  const rootFoldersList = filterItems(sortItems(
    folders.filter(f => !cleanPath(f.path).includes('/'))
  ));
  const rootFilesList = filterItems(sortItems(
    files.filter(f => !cleanPath(f.folder))
  ));

  // Empty state
  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="h-full bg-[#1e1e1e] text-white flex flex-col items-center justify-center p-4 text-center">
        <FolderPlus size={48} className="text-[#3c3c3c] mb-4" />
        <p className="text-[#858585] text-xs mb-4">No open folder</p>
        <button 
          onClick={onOpenFolder} 
          className="bg-[#007acc] text-white px-3 py-1.5 rounded text-xs hover:bg-[#006bb3] transition-colors"
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] text-white flex flex-col border-r border-[#3c3c3c]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-[#cccccc] font-medium bg-[#252526]">
        <span>Explorer</span>
        <div className="flex gap-1">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "p-1 hover:bg-[#3c3c3c] rounded transition-colors",
              showSearch && "bg-[#3c3c3c]"
            )}
            title="Search"
          >
            <Search size={14}/>
          </button>
          <button 
            onClick={() => startCreation('file', '')} 
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
            title="New File"
          >
            <FilePlus size={14}/>
          </button>
          <button 
            onClick={() => startCreation('folder', '')} 
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus size={14}/>
          </button>
          <button 
            onClick={collapseAll}
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
            title="Collapse All"
          >
            <ChevronRight size={14}/>
          </button>
          <button 
            onClick={onOpenFolder} 
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-2 py-2 bg-[#252526] border-b border-[#3c3c3c]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#3c3c3c] text-white text-xs px-2 py-1.5 rounded outline-none border border-transparent focus:border-[#007acc]"
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Project Name */}
        <div 
          className="flex items-center gap-1 px-1 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[11px] font-bold text-white uppercase tracking-wide transition-colors" 
          onClick={() => setProjectExpanded(!projectExpanded)}
        >
          {projectExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          <span>{projectName}</span>
        </div>

        {/* Root Content */}
        {projectExpanded && (
          <div className="ml-1">
            {creationState && creationState.parentPath === '' && (
              <InlineInput 
                type={creationState.type} 
                onComplete={handleCreationComplete} 
                onCancel={() => setCreationState(null)} 
              />
            )}
            
            {rootFoldersList.map(folder => (
              <FolderItem 
                key={folder.path} 
                folder={folder} 
                expandedFolders={expandedFolders} 
                toggleFolder={toggleFolder} 
                onCreateFile={onCreateFile} 
                onCreateFolder={onCreateFolder} 
                renamingId={renamingId} 
                setRenamingId={setRenamingId} 
                onRenameFolder={onRenameFolder} 
                onDeleteFolder={onDeleteFolder} 
                renderTree={renderTree} 
                startCreation={startCreation} 
              />
            ))}
            
            {rootFilesList.map(file => (
              <FileItem 
                key={file.id} 
                file={file} 
                depth={0} 
                activeFile={activeFile} 
                onFileClick={onFileClick} 
                renamingId={renamingId} 
                setRenamingId={setRenamingId} 
                onRenameFile={onRenameFile} 
                onDeleteFile={onDeleteFile} 
              />
            ))}

            {/* No results message */}
            {searchQuery && rootFoldersList.length === 0 && rootFilesList.length === 0 && (
              <div className="px-3 py-4 text-center text-[#858585] text-xs">
                No files found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;