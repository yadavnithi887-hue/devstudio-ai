import React, { useState, useEffect, useCallback } from 'react';
import ActivityBar from '@/components/ide/ActivityBar';
import FileExplorer from '@/components/ide/FileExplorer';
import EditorTabs from '@/components/ide/EditorTabs';
import CodeEditor from '@/components/ide/CodeEditor';
import Terminal from '@/components/ide/Terminal';
import AIChat from '@/components/ide/AIChat';
import WelcomeScreen from '@/components/ide/WelcomeScreen';
import StatusBar from '@/components/ide/StatusBar';
import SearchPanel from '@/components/ide/SearchPanel';
import DeleteModal from '@/components/ide/DeleteModal';
import CreateFileModal from '@/components/ide/CreateFileModal';
import MenuBar from '@/components/ide/MenuBar';
import ExtensionsPanel from '@/components/ide/ExtensionsPanel';
import WebPreview from '@/components/ide/WebPreview';
import GitPanel from '@/components/ide/GitPanel';
import DebugPanel from '@/components/ide/DebugPanel';
import SettingsPanel from '@/components/ide/SettingsPanel';
import CommandPalette from '@/components/ide/CommandPalette';
import Breadcrumbs from '@/components/ide/Breadcrumbs';
import { ShortcutsModal, TipsModal, AboutModal, WelcomeModal, ComingSoonToast, GoToLineModal, QuickOpenModal } from '@/components/ide/HelpModals';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';
import { registry } from "@/modules/core/ExtensionRegistry";

/**
 * Layout.jsx - Main IDE Layout
 * ✅ Fixed: Internal Extension System Integration
 * ✅ Registry-driven UI updates for StatusBar & Editor Buttons
 */

export default function Layout() {
  // Core file/project state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [projectName, setProjectName] = useState('DEVSTUDIO');

  // UI state
  const [activeView, setActiveView] = useState('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = React.useRef(false);

  // Editor & Terminal
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalMaximized, setTerminalMaximized] = useState(false);

  // Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('devstudio-settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
      wordWrap: 'off',
      minimap: true,
      lineNumbers: 'on',
      cursorBlinking: 'smooth',
      tabSize: 2,
      autoSave: false,
      sidebarPosition: 'left',
      aiProvider: 'gemini',
      aiModel: 'gemini-pro',
      apiKey: ''
    };
  });
  const [settingsUnsaved, setSettingsUnsaved] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Modals & helper UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [comingSoon, setComingSoon] = useState({ show: false, feature: '' });

  // Extensions & registry-driven UI
  const [extSidebarItems, setExtSidebarItems] = useState([]);
  const [installedExtensions, setInstalledExtensions] = useState(['web-preview']);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaximized, setPreviewMaximized] = useState(false);

  // ✅ Registry-driven UI items (StatusBar & Editor Buttons)
  const [statusBarItems, setStatusBarItems] = useState([]);
  const [extEditorButtons, setExtEditorButtons] = useState([]);

  // Misc
  const [unsavedFiles, setUnsavedFiles] = useState(new Set());
  const [outputLogs, setOutputLogs] = useState(['DevStudio AI Started...', 'System Ready.']);
  const [problems, setProblems] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [showExtensionDocs, setShowExtensionDocs] = useState(false);
  const [focusLine, setFocusLine] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Sidebar resizing handlers
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);
  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
  }, []);
  const resize = useCallback((e) => {
    if (isResizing.current) {
      const newWidth = e.clientX - 48;
      if (newWidth > 170 && newWidth < 900) setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Welcome modal on first load
// ✅ FINAL: Single Combined useEffect for Extension System
  useEffect(() => {
    console.log('🎬 Layout: Setting up extensions...');

    // 1️⃣ Create FULL context for extensions
    const context = {
      toast,
      getSettings: () => settings,
      toggleAIChat: () => {
        setActiveView('ai-history-panel');
        if (!sidebarOpen) setSidebarOpen(true);
      },
      // 🔥 NEW: Provide Electron API & File System Info
      electronAPI: window.electronAPI,
      getWorkspaceRoot: () => localStorage.getItem('devstudio-last-project'),
      activeFile: activeFile,
      updateEditorContent: (newContent) => {
        if (activeFile) {
            handleContentChange(activeFile.id, newContent);
        }
      },
      // Command execution for inter-extension communication
      executeCommand: (id, args) => registry.executeCommand(id, args)
    };

    // 2️⃣ Register listeners FIRST
    const removeStatus = registry.onStatusBarUpdate((item) => {
      console.log('📥 Layout: Received status bar item:', item);
      setStatusBarItems(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) {
          return prev.map(i => i.id === item.id ? item : i);
        }
        return [...prev, item];
      });
    });

    const removeEditor = registry.onEditorButtonUpdate((btn) => {
      console.log('📥 Layout: Received editor button:', btn);
      setExtEditorButtons(prev => {
        if (prev.find(b => b.id === btn.id)) return prev;
        return [...prev, btn];
      });
    });

    // 3️⃣ Initialize extensions
    console.log('⚡ Layout: Initializing registry...');
    registry.initialize(context);

    // 4️⃣ Get sidebar items
    const sidebarItems = registry.getSidebarItems();
    console.log('📋 Layout: Loaded sidebar items:', sidebarItems);
    setExtSidebarItems(sidebarItems);

    console.log('✅ Layout: Extensions setup complete');

    // 5️⃣ Cleanup on unmount
    return () => {
      console.log('🧹 Layout: Cleaning up extension listeners');
      try { removeStatus(); } catch (e) { console.error(e); }
      try { removeEditor(); } catch (e) { console.error(e); }
    };
  }, [activeFile, settings, sidebarOpen]); // Dependencies updated

  // Auto-load last project
  useEffect(() => {
    const loadLastProject = async () => {
      const lastPath = localStorage.getItem('devstudio-last-project');
      const recents = JSON.parse(localStorage.getItem('devstudio-recents') || '[]');
      setRecentProjects(recents);
      if (lastPath && window.electronAPI) {
        const loadingToast = toast.loading('Loading previous project...');
        try {
          const result = await window.electronAPI.openPath(lastPath);
          if (result) {
            setFiles(result.files || []);
            setFolders(result.folders || []);
            const folderName = result.rootPath.split('\\').pop().split('/').pop();
            setProjectName(folderName.toUpperCase());
            toast.dismiss(loadingToast);
            toast.success(`Welcome back to ${folderName}`);
          } else {
            localStorage.removeItem('devstudio-last-project');
            toast.dismiss(loadingToast);
          }
        } catch (e) {
          toast.dismiss(loadingToast);
          console.error(e);
        }
      }
    };
    loadLastProject();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 🔥 DEBUG PANEL SHORTCUT
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDebugPanel(prev => !prev);
        return;
    }
      if (showCreateModal || showQuickOpen || showGoToLine || showCommandPalette || !!deleteTarget) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            if (e.shiftKey) { e.preventDefault(); setShowCommandPalette(true); }
            else { e.preventDefault(); setShowQuickOpen(true); }
            break;
          case 'i':
            if (!e.shiftKey) { e.preventDefault(); /* toggle AI */ }
            break;
          case '`':
            e.preventDefault(); setTerminalOpen(prev => !prev);
            break;
          case 'n':
            e.preventDefault(); setCreateType(e.shiftKey ? 'folder' : 'file'); setShowCreateModal(true);
            break;
          case 's':
            e.preventDefault();
            if (activeFile && window.electronAPI) {
              window.electronAPI.saveFile(activeFile.realPath, activeFile.content).then(res => {
                if (res.success) {
                  toast.success('File Saved!');
                  setUnsavedFiles(prev => { const s = new Set(prev); s.delete(activeFile.id); return s; });
                } else toast.error('Save failed');
              });
            }
            break;
          case 'b':
            e.preventDefault(); setSidebarOpen(prev => !prev);
            break;
          default:
            break;
        }
      }
      if (e.key === 'F1') { e.preventDefault(); setShowCommandPalette(true); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, showCreateModal, showQuickOpen, showGoToLine, showCommandPalette, deleteTarget]);

  // File click handler (open in editor)
  const handleFileClick = async (file) => {
    if (!file.content && window.electronAPI) {
      try {
        const content = await window.electronAPI.readFile(file.realPath || file.id);
        file.content = content;
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, content } : f));
      } catch (e) { console.error(e); }
    }
    if (!openFiles.find(f => f.id === file.id)) setOpenFiles(prev => [...prev, file]);
    setActiveFile(file);
  };

  // Content change
  const handleContentChange = useCallback((fileId, content) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
    if (activeFile?.id === fileId) setActiveFile(prev => ({ ...prev, content }));
    setUnsavedFiles(prev => new Set(prev).add(fileId));
  }, [activeFile?.id]);

  // Create file / folder direct helpers (calls into electronAPI)
  const handleCreateFileDirect = async (arg1, arg2) => {
    let name, folder;
    if (typeof arg1 === 'object' && arg1 !== null) {
      name = arg1.name; folder = arg1.folder;
    } else { name = arg1; folder = arg2; }

    if (!name) return;
    if (!window.electronAPI) return toast.error('No filesystem API available');

    const rootPath = localStorage.getItem('devstudio-last-project');
    if (!rootPath) return toast.error('No project open');

    const isWindows = rootPath.includes('\\');
    const sep = isWindows ? '\\' : '/';
    let targetDir = rootPath;

    if (folder && folder !== 'root') {
      if (folder.includes(rootPath)) targetDir = folder;
      else {
        const normFolder = folder.replace(/\//g, sep).replace(/\\/g, sep);
        if (normFolder.startsWith(rootPath)) targetDir = normFolder;
        else targetDir = `${rootPath}${sep}${normFolder}`;
      }
    }

    const finalPath = `${targetDir}${sep}${name}`;
    try {
      const result = await window.electronAPI.createFile(finalPath);
      if (result.success) {
        await handleOpenRecent(rootPath);
        toast.success(`Created: ${name}`);
      } else toast.error(result.error || 'Create failed');
    } catch (e) { console.error(e); }
  };

  const handleCreateFolderDirect = async (arg1, arg2) => {
    let name, folder;
    if (typeof arg1 === 'object' && arg1 !== null) {
      name = arg1.name; folder = arg1.folder;
    } else { name = arg1; folder = arg2; }

    if (!name) return;
    if (!window.electronAPI) return toast.error('No filesystem API available');

    const rootPath = localStorage.getItem('devstudio-last-project');
    const isWindows = rootPath.includes('\\');
    const sep = isWindows ? '\\' : '/';
    let targetDir = rootPath;

    if (folder && folder !== 'root') {
      if (folder.includes(rootPath)) targetDir = folder;
      else {
        const normFolder = folder.replace(/\//g, sep).replace(/\\/g, sep);
        if (normFolder.startsWith(rootPath)) targetDir = normFolder;
        else targetDir = `${rootPath}${sep}${normFolder}`;
      }
    }

    const finalPath = `${targetDir}${sep}${name}`;
    try {
      const result = await window.electronAPI.createFolder(finalPath);
      if (result.success) {
        await handleOpenRecent(rootPath);
        toast.success(`Created: ${name}`);
      } else toast.error(result.error || 'Create folder failed');
    } catch (e) { console.error(e); }
  };

  // Delete flow
  const promptDeleteFile = (file) => setDeleteTarget({ type: 'file', item: file });
  const promptDeleteFolder = (folder) => setDeleteTarget({ type: 'folder', item: folder });

  const confirmDelete = async () => {
    if (!deleteTarget || !window.electronAPI) return;
    const path = deleteTarget.item.realPath;
    try {
      await window.electronAPI.deletePath(path);
      const rootPath = localStorage.getItem('devstudio-last-project');
      await handleOpenRecent(rootPath);
      if (deleteTarget.type === 'file') handleTabClose(deleteTarget.item);
      setDeleteTarget(null);
      toast.success('Deleted');
    } catch (e) { console.error(e); toast.error('Delete failed'); }
  };

  // Rename
  const handleRenameFile = async (file, newName) => {
    if (!window.electronAPI || !newName || newName === file.name) return;
    const oldPath = file.realPath;
    const lastSlash = oldPath.lastIndexOf('\\') !== -1 ? oldPath.lastIndexOf('\\') : oldPath.lastIndexOf('/');
    const directory = oldPath.substring(0, lastSlash);
    const newPath = `${directory}\\${newName}`;
    try {
      const result = await window.electronAPI.renamePath(oldPath, newPath);
      if (result.success) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: newName, realPath: newPath, id: newPath, path: f.path.replace(file.name, newName) } : f));
        if (activeFile?.id === file.id) setActiveFile(prev => ({ ...prev, name: newName, realPath: newPath, id: newPath }));
        setOpenFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: newName, realPath: newPath, id: newPath } : f));
        toast.success('Renamed successfully');
      } else toast.error(`Rename failed: ${result.error}`);
    } catch (e) { console.error(e); toast.error('Error renaming file'); }
  };

  const handleRenameFolder = async (folder, newName) => {
    if (!window.electronAPI || !newName || newName === folder.name) return;
    const oldPath = folder.realPath;
    const lastSlash = oldPath.lastIndexOf('\\') !== -1 ? oldPath.lastIndexOf('\\') : oldPath.lastIndexOf('/');
    const parentDir = oldPath.substring(0, lastSlash);
    const newPath = `${parentDir}\\${newName}`;
    try {
      const result = await window.electronAPI.renamePath(oldPath, newPath);
      if (result.success) {
        const currentProject = localStorage.getItem('devstudio-last-project');
        if (currentProject) {
          const refresh = await window.electronAPI.openPath(currentProject);
          if (refresh) {
            setFiles(refresh.files || []);
            setFolders(refresh.folders || []);
          }
        }
        toast.success('Folder renamed');
      } else toast.error(`Rename failed: ${result.error}`);
    } catch (e) { console.error(e); toast.error('Error renaming folder'); }
  };

  // Open folder
  const handleOpenFolder = async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.openFolder();
      if (result) {
        setFiles(result.files || []);
        setFolders(result.folders || []);
        const folderName = result.rootPath.split('\\').pop().split('/').pop();
        setProjectName(folderName.toUpperCase());
        setOpenFiles([]); setActiveFile(null);
        localStorage.setItem('devstudio-last-project', result.rootPath);
        const newRecents = [result.rootPath, ...recentProjects.filter(p => p !== result.rootPath)].slice(0, 5);
        setRecentProjects(newRecents);
        localStorage.setItem('devstudio-recents', JSON.stringify(newRecents));
        toast.success(`Opened: ${folderName}`);
      }
    } catch (e) { console.error(e); }
  };

  // Open recent by path
  const handleOpenRecent = async (path) => {
    if (!window.electronAPI) return;
    const loadingToast = toast.loading(`Opening ${path}...`);
    try {
      const result = await window.electronAPI.openPath(path);
      if (result) {
        setFiles(result.files || []);
        setFolders(result.folders || []);
        const folderName = result.rootPath.split('\\').pop().split('/').pop();
        setProjectName(folderName.toUpperCase());
        setOpenFiles([]); setActiveFile(null);
        const newRecents = [result.rootPath, ...recentProjects.filter(p => p !== result.rootPath)].slice(0, 5);
        setRecentProjects(newRecents);
        localStorage.setItem('devstudio-last-project', result.rootPath);
        localStorage.setItem('devstudio-recents', JSON.stringify(newRecents));
        toast.dismiss(loadingToast); toast.success(`Opened: ${folderName}`);
      } else {
        toast.dismiss(loadingToast); toast.error('Folder not found');
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      console.error(e);
    }
  };

  // Tab close
  const handleTabClose = (file) => {
    const newOpenFiles = openFiles.filter(f => f.id !== file.id);
    setOpenFiles(newOpenFiles);
    if (activeFile?.id === file.id) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  // Navigate from problems list
  const handleNavigateProblem = (filename, line) => {
    const targetFile = files.find(f => f.name === filename || f.path?.endsWith(filename));
    if (targetFile) {
      handleFileClick(targetFile);
      setFocusLine(line);
    } else toast.error(`File ${filename} not found`);
  };

  // Apply code from AIChat or other sources
  const handleApplyCode = (code) => {
    if (activeFile) handleContentChange(activeFile.id, code);
  };

  // Extension selection UI
  const handleExtensionSelect = (ext) => {
    setActiveFile(null);
    setSelectedExtension(ext);
  };

  // Menu actions
  const handleMenuAction = (action, data) => {
    switch (action) {
      case 'newFile': setCreateType('file'); setShowCreateModal(true); break;
      case 'newFolder': setCreateType('folder'); setShowCreateModal(true); break;
      case 'openFolder': handleOpenFolder(); break;
      case 'closeFolder':
        setFiles([]); setFolders([]); setOpenFiles([]); setActiveFile(null);
        setProjectName('DEVSTUDIO'); localStorage.removeItem('devstudio-last-project');
        window.location.reload();
        toast.success('Folder closed');
        break;
      case 'closeWindow':
      case 'quit':
        if (window.electronAPI) window.electronAPI.closeWindow();
        break;
      case 'viewExplorer': setActiveView('explorer'); setSidebarOpen(true); break;
      case 'viewSearch': setActiveView('search'); setSidebarOpen(true); break;
      case 'viewGit': setActiveView('git'); setSidebarOpen(true); break;
      case 'viewDebug': setActiveView('debug'); setSidebarOpen(true); break;
      case 'viewExtensions': setActiveView('extensions'); setSidebarOpen(true); break;
      case 'viewTerminal': setTerminalOpen(prev => !prev); break;
      case 'commandPalette': setShowCommandPalette(true); break;
      case 'showComingSoon':
        setComingSoon({ show: true, feature: data }); setTimeout(() => setComingSoon({ show: false, feature: '' }), 3000);
        break;
      default: break;
    }
  };

  // Render sidebar content based on activeView or extension panels
  const renderSidebar = () => {
    switch (activeView) {
      case 'explorer':
        return <FileExplorer
          files={files}
          folders={folders}
          activeFile={activeFile}
          onFileClick={handleFileClick}
          onCreateFile={handleCreateFileDirect}
          onCreateFolder={handleCreateFolderDirect}
          onDeleteFile={promptDeleteFile}
          onDeleteFolder={promptDeleteFolder}
          onRenameFile={handleRenameFile}
          onRenameFolder={handleRenameFolder}
          projectName={projectName}
          onOpenFolder={handleOpenFolder}
        />;
      case 'search':
        return <SearchPanel files={files} onFileClick={handleFileClick} onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} />;
      case 'git':
        return <GitPanel files={files} onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} rootPath={localStorage.getItem('devstudio-last-project')} />;
      case 'debug':
        return <DebugPanel onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} activeFile={activeFile} files={files} />;
      case 'extensions':
        return <ExtensionsPanel onSelectExtension={(ext) => handleExtensionSelect(ext)} />;
      case 'settings':
        return <SettingsPanel settings={settings} onSettingChange={(k,v)=>{ setSettings(prev=>({...prev,[k]:v})); setSettingsUnsaved(true);}} onSave={(s)=>{ setSettings(s); localStorage.setItem('devstudio-settings', JSON.stringify(s)); setSettingsUnsaved(false); }} unsaved={settingsUnsaved} />;
      default:
        // Check if an extension provides this panel
        const ExtensionComponent = registry.getSidebarPanel(activeView);
        if (ExtensionComponent) return <ExtensionComponent />;
        return null;
    }
  };

  // ✅ Render StatusBar (with extension items)
  const renderStatusBar = () => (
    <StatusBar
      extensionItems={statusBarItems}
      onItemClick={(command) => {
        if (!command) return;
        try { 
          registry.executeCommand(command); 
        } catch (e) { 
          console.error('Error executing command:', command, e); 
        }
      }}
    />
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] overflow-hidden text-white">
      {/* Title Bar */}
      <div className="h-8 bg-[#3c3c3c] flex items-center justify-between px-3 text-xs text-[#cccccc]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
          </div>
          <MenuBar onAction={handleMenuAction} settings={settings} onSettingToggle={(id) => setSettings(p => ({ ...p, [id]: !p[id] }))} />
        </div>
        <div className="flex-1 text-center">{activeFile?.name || 'DevStudio'} - DevStudio AI</div>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          aiOpen={false} 
          setAiOpen={() => {}} 
          installedExtensions={installedExtensions} 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          onOpenSettings={() => setShowSettingsModal(true)} 
          extensionItems={extSidebarItems} 
        />

        {sidebarOpen && (
          <div className="relative flex-shrink-0 border-r border-[#3c3c3c]" style={{ width: `${sidebarWidth}px` }}>
            {renderSidebar()}
            <div onMouseDown={startResizing} className="absolute top-0 right-[-4px] w-[8px] h-full cursor-col-resize z-50 hover:bg-[#007acc] opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorTabs openFiles={openFiles} activeFile={activeFile} onTabClick={handleFileClick} onTabClose={handleTabClose} unsavedFiles={unsavedFiles} />
          <Breadcrumbs file={activeFile} />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {showExtensionDocs ? (
                <div className="p-4">Extension Docs</div>
              ) : selectedExtension ? (
                <div className="flex-1 relative">
                  <div className="p-4">
                    <h2 className="text-xl font-semibold">{selectedExtension.name || 'Extension'}</h2>
                    <p className="text-sm text-[#cfcfcf]">{selectedExtension.description}</p>
                  </div>
                  <button onClick={() => setSelectedExtension(null)} className="absolute top-2 right-4 bg-[#3c3c3c] p-1 rounded text-white hover:bg-red-500">✕</button>
                </div>
              ) : activeFile ? (
                <CodeEditor
                  file={activeFile}
                  onContentChange={handleContentChange}
                  settings={settings}
                  onValidate={(markers) => setProblems(markers)}
                  focusLine={focusLine}
                  extensionButtons={extEditorButtons}
                  onExtensionButtonClick={(command) => {
                    if (!command) return;
                    try { 
                      registry.executeCommand(command); 
                    } catch (e) { 
                      console.error('Error executing editor button command:', command, e); 
                    }
                  }}
                />
              ) : (
                <WelcomeScreen 
                  onOpenFolder={handleOpenFolder} 
                  onCreateFile={() => { setCreateType('file'); setShowCreateModal(true); }} 
                  recentProjects={recentProjects} 
                  onOpenRecent={handleOpenRecent} 
                />
              )}

              {installedExtensions.includes('web-preview') && previewOpen && (
                <WebPreview 
                  files={files} 
                  isOpen={true} 
                  onClose={() => setPreviewOpen(false)} 
                  onMaximize={() => setPreviewMaximized(!previewMaximized)} 
                  isMaximized={previewMaximized} 
                />
              )}
            </div>

            <div className={cn('border-t border-[#3c3c3c]', !terminalOpen && 'hidden')}>
              <Terminal
                isOpen={terminalOpen}
                onToggle={() => setTerminalOpen(prev => !prev)}
                onMaximize={() => setTerminalMaximized(prev => !prev)}
                isMaximized={terminalMaximized}
                problems={problems}
                outputLogs={outputLogs}
                onNavigateProblem={handleNavigateProblem}
              />
            </div>
          </div>
        </div>

        <AIChat isOpen={false} onClose={() => {}} activeFile={activeFile} onApplyCode={handleApplyCode} files={files} />
      </div>

      <DeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={deleteTarget?.item?.name || ''} type={deleteTarget?.type || ''} />

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <TipsModal isOpen={showTips} onClose={() => setShowTips(false)} />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <GoToLineModal isOpen={showGoToLine} onClose={() => setShowGoToLine(false)} onGoToLine={(line) => console.log('Go to line:', line)} maxLine={activeFile?.content?.split('\n').length || 1} />
      <QuickOpenModal isOpen={showQuickOpen} onClose={() => setShowQuickOpen(false)} files={files} onSelect={handleFileClick} />
      <ComingSoonToast isOpen={comingSoon.show} feature={comingSoon.feature} onClose={() => setComingSoon({ show: false, feature: '' })} />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onAction={handleMenuAction} />

      <CreateFileModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); }} onCreate={createType === 'file' ? handleCreateFileDirect : handleCreateFolderDirect} folders={folders} type={createType} initialFolder={null} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg w-11/12 h-5/6 max-w-6xl">
            <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-[#858585] hover:text-white text-xl">×</button>
            </div>
            <div className="h-full">
              <SettingsPanel 
                settings={settings} 
                onSettingChange={(k, v) => { 
                  setSettings(prev => ({ ...prev, [k]: v })); 
                  setSettingsUnsaved(true); 
                }} 
                onSave={(s) => { 
                  setSettings(s); 
                  localStorage.setItem('devstudio-settings', JSON.stringify(s)); 
                  setSettingsUnsaved(false); 
                }} 
                unsaved={settingsUnsaved} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes warning */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Unsaved Changes</h3>
            <p className="text-[#cccccc] mb-6">You have unsaved settings changes. Do you want to save them before closing?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUnsavedWarning(false)} className="px-4 py-2 bg-[#3c3c3c] text-white rounded hover:bg-[#454545]">Cancel</button>
              <button onClick={() => { setShowUnsavedWarning(false); setShowSettingsModal(false); }} className="px-4 py-2 bg-[#ff5f56] text-white rounded hover:bg-[#e54b42]">Don't Save</button>
              <button onClick={() => { localStorage.setItem('devstudio-settings', JSON.stringify(settings)); setShowUnsavedWarning(false); setShowSettingsModal(false); setSettingsUnsaved(false); }} className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005a9e]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {renderStatusBar()}
      

      <Toaster />
    </div>
  );
}  
