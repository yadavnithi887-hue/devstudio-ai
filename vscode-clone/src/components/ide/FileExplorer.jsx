import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, File, Folder, FolderOpen, 
  FilePlus, FolderPlus, Edit3, Trash2, Copy, 
  FileCode, Braces, FileText, RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";

// --- Helper: Path Normalizer ---
const cleanPath = (p) => {
  if (!p || p === 'root') return '';
  return p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
};

// --- Icon Helper ---
const getFileIcon = (filename) => {
  if (!filename) return { icon: File, color: 'text-gray-500' };
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    js: { icon: FileCode, color: 'text-yellow-400' },
    jsx: { icon: FileCode, color: 'text-blue-400' },
    ts: { icon: FileCode, color: 'text-blue-500' },
    tsx: { icon: FileCode, color: 'text-blue-500' },
    css: { icon: FileCode, color: 'text-blue-300' },
    html: { icon: FileCode, color: 'text-orange-500' },
    json: { icon: Braces, color: 'text-yellow-500' },
    md: { icon: FileText, color: 'text-gray-400' },
  };
  return icons[ext] || { icon: File, color: 'text-gray-500' };
};

// --- Inline Input Component ---
const InlineInput = ({ type, onComplete, onCancel, depth }) => {
  const [val, setVal] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if(ref.current) ref.current.focus();
  }, []);

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && val.trim()) onComplete(val.trim());
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center py-1 px-2 bg-[#37373d]" style={{ paddingLeft: `${depth * 16 + 12}px` }}>
      <span className="mr-2">
        {type === 'folder' ? <Folder size={16} className="text-blue-400"/> : <File size={16} className="text-gray-400"/>}
      </span>
      <input
        ref={ref}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={onCancel} 
        onKeyDown={handleKeyDown}
        className="bg-[#1e1e1e] text-white border border-[#007acc] text-[13px] h-6 outline-none w-full px-1"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// --- File Item ---
const FileItem = ({ file, depth, activeFile, onFileClick, renamingId, setRenamingId, onRenameFile, onDeleteFile }) => {
  const [newName, setNewName] = useState(file.name);
  const { icon: Icon, color } = getFileIcon(file.name);
  const isRenaming = renamingId === file.id;

  useEffect(() => { if (isRenaming) setNewName(file.name); }, [isRenaming, file.name]);

  const submitRename = () => {
    if (newName.trim() && newName !== file.name) onRenameFile(file, newName);
    setRenamingId(null);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] select-none text-[#cccccc]",
            activeFile?.id === file.id && "bg-[#37373d] text-white"
          )}
          style={{ paddingLeft: `${depth * 16 + 24}px` }}
          onClick={(e) => { e.stopPropagation(); onFileClick(file); }}
        >
          <span className="mr-2 flex-shrink-0"><Icon size={16} className={color} /></span>
          {isRenaming ? (
            <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={submitRename} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingId(null); }} onClick={(e) => e.stopPropagation()} className="bg-[#3c3c3c] text-white px-1 outline-none border border-[#007acc] h-5 text-xs flex-1" />
          ) : (
            <span className="text-[13px] truncate flex-1">{file.name}</span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[#252526] border-[#454545] text-white">
        <ContextMenuItem onClick={() => setRenamingId(file.id)}><Edit3 size={14} className="mr-2"/> Rename</ContextMenuItem>
        <ContextMenuItem onClick={() => onDeleteFile(file)} className="text-red-400"><Trash2 size={14} className="mr-2"/> Delete</ContextMenuItem>
        <ContextMenuSeparator className="bg-[#454545]"/>
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(file.realPath)}><Copy size={14} className="mr-2"/> Copy Path</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// --- Folder Item ---
const FolderItem = ({ folder, depth, expandedFolders, toggleFolder, onCreateFile, onCreateFolder, renamingId, setRenamingId, onRenameFolder, onDeleteFolder, renderTree, startCreation }) => {
  const [newName, setNewName] = useState(folder.name);
  const isExpanded = expandedFolders[folder.path];
  const isRenaming = renamingId === folder.path;

  useEffect(() => { if (isRenaming) setNewName(folder.name); }, [isRenaming, folder.name]);

  const submitRename = () => {
    if (newName.trim() && newName !== folder.name) onRenameFolder(folder, newName);
    setRenamingId(null);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] select-none text-[#cccccc]"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={(e) => { e.stopPropagation(); toggleFolder(folder.path); }}
          >
            <span className="mr-1 flex-shrink-0">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
            <span className="mr-2 flex-shrink-0">{isExpanded ? <FolderOpen size={16} className="text-[#dcb67a]" /> : <Folder size={16} className="text-[#dcb67a]" />}</span>
            {isRenaming ? (
              <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={submitRename} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingId(null); }} onClick={(e) => e.stopPropagation()} className="bg-[#3c3c3c] text-white px-1 outline-none border border-[#007acc] h-5 text-xs flex-1" />
            ) : (
              <span className="text-[13px] truncate">{folder.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#252526] border-[#454545] text-white">
          <ContextMenuItem onClick={() => startCreation('file', folder.realPath || folder.path)}><FilePlus size={14} className="mr-2"/> New File</ContextMenuItem>
          <ContextMenuItem onClick={() => startCreation('folder', folder.realPath || folder.path)}><FolderPlus size={14} className="mr-2"/> New Folder</ContextMenuItem>
          <ContextMenuSeparator className="bg-[#454545]"/>
          <ContextMenuItem onClick={() => setRenamingId(folder.path)}><Edit3 size={14} className="mr-2"/> Rename</ContextMenuItem>
          <ContextMenuItem onClick={() => onDeleteFolder(folder)} className="text-red-400"><Trash2 size={14} className="mr-2"/> Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Recursive Children */}
      {isExpanded && renderTree(folder.path, depth + 1)}
    </div>
  );
};

// --- Main Explorer ---
const FileExplorer = ({ 
  files = [], folders = [], activeFile, 
  onFileClick, onCreateFile, onCreateFolder, 
  onDeleteFile, onDeleteFolder, onRenameFile, onRenameFolder,
  projectName, onOpenFolder 
}) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [creationState, setCreationState] = useState(null); // { type, parentPath }

  // Auto expand Root
  useEffect(() => {
      const src = folders.find(f => f.name === 'src');
      if(src) setExpandedFolders(prev => ({...prev, [src.path]: true}));
  }, [folders.length]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // --- Creation Handlers ---
  const startCreation = (type, parentPath) => {
    // Parent folder ko expand karo
    if (parentPath) {
        // Find relative path to expand in UI
        // Note: parentPath here comes from ContextMenu which might be realPath
        // Logic needs match with UI paths. For simplicity, we expand all if root.
        // Or logic to find relative path from realPath: Not easy here without root.
        // Assuming parentPath matches folder.path
        setExpandedFolders(prev => ({ ...prev, [parentPath]: true }));
    } else {
        setProjectExpanded(true);
    }
    setCreationState({ type, parentPath: cleanPath(parentPath) });
  };

  const handleCreationComplete = (name) => {
    if (creationState.type === 'file') {
        onCreateFile({ name, folder: creationState.parentPath });
    } else {
        onCreateFolder({ name, folder: creationState.parentPath });
    }
    setCreationState(null);
  };

  // --- Recursive Tree Renderer ---
  const renderTree = (parentPath, depth) => {
    const normParent = cleanPath(parentPath);

    const childFolders = folders.filter(f => {
        const fPath = cleanPath(f.path);
        if (!fPath.startsWith(normParent + '/')) return false;
        return !fPath.slice(normParent.length + 1).includes('/');
    });

    const childFiles = files.filter(f => {
        const fFolder = cleanPath(f.folder);
        return fFolder === normParent;
    });

    return (
      <>
        {/* 🔥 INLINE INPUT BOX HERE */}
        {creationState && creationState.parentPath === normParent && (
            <InlineInput 
                type={creationState.type} 
                depth={depth} 
                onComplete={handleCreationComplete} 
                onCancel={() => setCreationState(null)} 
            />
        )}

        {childFolders.map(folder => (
          <FolderItem 
            key={folder.path} folder={folder} depth={depth}
            expandedFolders={expandedFolders} toggleFolder={toggleFolder}
            onCreateFile={onCreateFile} onCreateFolder={onCreateFolder}
            renamingId={renamingId} setRenamingId={setRenamingId}
            onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
            renderTree={renderTree}
            startCreation={(type, path) => startCreation(type, path ? folder.path : '')} // Use UI path for expansion
            files={files} folders={folders}
          />
        ))}
        {childFiles.map(file => (
          <FileItem 
            key={file.id} file={file} depth={depth} activeFile={activeFile}
            onFileClick={onFileClick} renamingId={renamingId} setRenamingId={setRenamingId}
            onRenameFile={onRenameFile} onDeleteFile={onDeleteFile}
          />
        ))}
      </>
    );
  };

  // --- Root Logic ---
  const rootFoldersList = folders.filter(f => !cleanPath(f.path).includes('/'));
  const rootFilesList = files.filter(f => !cleanPath(f.folder));

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="h-full bg-[#1e1e1e] text-white flex flex-col items-center justify-center p-4 text-center">
        <p className="text-[#858585] text-xs mb-4">No open folder</p>
        <button onClick={onOpenFolder} className="bg-[#007acc] text-white px-3 py-1.5 rounded text-xs hover:bg-[#006bb3]">Open Folder</button>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] text-white flex flex-col border-r border-[#3c3c3c]" onContextMenu={(e) => {e.preventDefault(); startCreation('file', ''); }}>
      <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-[#cccccc] font-medium bg-[#252526]">
        <span>Explorer</span>
        <div className="flex gap-1">
          <button onClick={() => startCreation('file', '')} className="p-1 hover:bg-[#3c3c3c] rounded"><FilePlus size={14}/></button>
          <button onClick={() => startCreation('folder', '')} className="p-1 hover:bg-[#3c3c3c] rounded"><FolderPlus size={14}/></button>
          <button onClick={onOpenFolder} className="p-1 hover:bg-[#3c3c3c] rounded"><FolderOpen size={14}/></button>
          <button className="p-1 hover:bg-[#3c3c3c] rounded"><RefreshCw size={14}/></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div
          className="flex items-center gap-1 px-1 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[11px] font-bold text-white uppercase tracking-wide"
          onClick={() => setProjectExpanded(!projectExpanded)}
        >
          {projectExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          <span>{projectName}</span>
        </div>

        {projectExpanded && (
          <div>
             {/* 🔥 INLINE INPUT AT ROOT */}
             {creationState && creationState.parentPath === '' && (
                <InlineInput 
                    type={creationState.type} 
                    depth={0} 
                    onComplete={handleCreationComplete} 
                    onCancel={() => setCreationState(null)} 
                />
             )}
             
            {rootFoldersList.map(folder => (
               <FolderItem 
                 key={folder.path} folder={folder} depth={0}
                 expandedFolders={expandedFolders} toggleFolder={toggleFolder}
                 onCreateFile={onCreateFile} onCreateFolder={onCreateFolder}
                 renamingId={renamingId} setRenamingId={setRenamingId}
                 onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
                 renderTree={renderTree}
                 startCreation={(type, path) => startCreation(type, folder.path)}
                 files={files} folders={folders}
               />
            ))}
            {rootFilesList.map(file => (
               <FileItem 
                 key={file.id} file={file} depth={0} activeFile={activeFile}
                 onFileClick={onFileClick} renamingId={renamingId} setRenamingId={setRenamingId}
                 onRenameFile={onRenameFile} onDeleteFile={onDeleteFile}
               />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;