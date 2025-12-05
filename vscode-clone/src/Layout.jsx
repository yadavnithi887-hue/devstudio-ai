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

export default function IDE() {
  const [files, setFiles] = useState([]);
  const [unsavedFiles, setUnsavedFiles] = useState(new Set());
  const [targetFolder, setTargetFolder] = useState(null);
  const [projectName, setProjectName] = useState('DEVSTUDIO');
  const [folders, setFolders] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [activeView, setActiveView] = useState('explorer');
  const [aiOpen, setAiOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  
  const [installedExtensions, setInstalledExtensions] = useState(['web-preview']);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaximized, setPreviewMaximized] = useState(false);
  
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [comingSoon, setComingSoon] = useState({ show: false, feature: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // --- Real Editor Settings ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('devstudio-settings');
    return saved ? JSON.parse(saved) : {
      // Editor Defaults
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
      wordWrap: 'off',
      minimap: true,
      lineNumbers: 'on',
      cursorBlinking: 'smooth',
      tabSize: 2,
      autoSave: false,

      // Window Defaults
      sidebarPosition: 'left',

      // 🔥 AI Defaults (Taki settings me dikhe)
      aiProvider: 'gemini',
      aiModel: 'gemini-pro',
      apiKey: '' // Security ke liye blank rakhein
    };
  });

  const [settingsUnsaved, setSettingsUnsaved] = useState(false);

  // Save settings function
  const saveSettings = () => {
    localStorage.setItem('devstudio-settings', JSON.stringify(settings));
    setSettingsUnsaved(false);
    toast.success("Settings saved successfully!", {
      position: "bottom-right",
      duration: 3000,
    });
  };

  // Modified setting change handler
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSettingsUnsaved(true);
  };

  // Handle settings modal close
  const handleSettingsClose = () => {
    if (settingsUnsaved) {
      setShowUnsavedWarning(true);
    } else {
      setShowSettingsModal(false);
    }
  };

  // Confirm close without saving
  const confirmCloseWithoutSaving = () => {
    setShowUnsavedWarning(false);
    setShowSettingsModal(false);
    // Reset unsaved state
    setSettingsUnsaved(false);
  };

  // Discard changes in settings panel
  const discardSettingsChanges = () => {
    setSettingsUnsaved(false);
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'file'|'folder', item: obj }

  const [problems, setProblems] = useState([]);
  const [outputLogs, setOutputLogs] = useState(['DevStudio AI Started...', 'System Ready.']);
  const [focusLine, setFocusLine] = useState(null);

  // Sidebar Resizing
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = React.useRef(false);

  const startResizing = React.useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const resize = React.useCallback((e) => {
    if (isResizing.current) {
      const newWidth = e.clientX - 48;
      if (newWidth > 170 && newWidth < 800) setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('devstudio-welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('devstudio-welcome', 'true');
    }
  }, []);

  // Auto Load
  useEffect(() => {
    const loadLastProject = async () => {
      const lastPath = localStorage.getItem('devstudio-last-project');
      const recents = JSON.parse(localStorage.getItem('devstudio-recents') || '[]');
      setRecentProjects(recents);
      
      if (lastPath && window.electronAPI) {
        const loadingToast = toast.loading("Loading previous project...");
        const result = await window.electronAPI.openPath(lastPath);
        if (result) {
          setFiles(result.files);
          setFolders(result.folders);
          const folderName = result.rootPath.split('\\').pop().split('/').pop();
          setProjectName(folderName.toUpperCase());
          toast.dismiss(loadingToast);
          toast.success(`Welcome back to ${folderName}`);
        } else {
          localStorage.removeItem('devstudio-last-project');
          toast.dismiss(loadingToast);
        }
      }
    };
    loadLastProject();
  }, []);
  
  // Watcher
  useEffect(() => {
    if (window.electronAPI) {
      const removeListener = window.electronAPI.onFileChanged(async () => {
        const currentPath = localStorage.getItem('devstudio-last-project');
        if (currentPath) {
          const result = await window.electronAPI.openPath(currentPath);
          if (result) {
            setFiles(result.files);
            setFolders(result.folders);
          }
        }
      });
      return () => removeListener();
    }
  }, []);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 🔥 FIX: Agar Modal khula hai, to shortcuts ignore karo
      if (showCreateModal || showQuickOpen || showGoToLine || showCommandPalette || !!deleteTarget) {
         return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'p':
            if (e.shiftKey) { e.preventDefault(); setShowCommandPalette(true); }
            else { e.preventDefault(); setShowQuickOpen(true); }
            break;
          case 'i':
            if (!e.shiftKey) { e.preventDefault(); setAiOpen(prev => !prev); }
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
              window.electronAPI.saveFile(activeFile.realPath, activeFile.content)
                .then(res => {
                  if (res.success) {
                    toast.success("File Saved!");
                    setUnsavedFiles(prev => { const newSet = new Set(prev); newSet.delete(activeFile.id); return newSet; });
                  } else { toast.error("Save Failed!"); }
                });
            }
            break;
          case 'b': e.preventDefault(); setSidebarOpen(prev => !prev); break;
          case 'j': e.preventDefault(); setTerminalOpen(prev => !prev); break;
        }
      }
      if (e.key === 'F1') { e.preventDefault(); setShowCommandPalette(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);
  
  const handleFileClick = async (file) => {
    if (!file.content && window.electronAPI) {
      const content = await window.electronAPI.readFile(file.realPath || file.id);
      file.content = content;
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, content } : f));
    }
    if (!openFiles.find(f => f.id === file.id)) setOpenFiles(prev => [...prev, file]);
    setActiveFile(file);
  };

  const handleNavigateProblem = (filename, line) => {
    const targetFile = files.find(f => f.name === filename || f.path.endsWith(filename));
    if (targetFile) {
      handleFileClick(targetFile);
      setFocusLine(line);
    } else { toast.error(`File ${filename} not found`); }
  };
  
  const handleTabClose = (file) => {
    const newOpenFiles = openFiles.filter(f => f.id !== file.id);
    setOpenFiles(newOpenFiles);
    if (activeFile?.id === file.id) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };
  
  const handleContentChange = useCallback((fileId, content) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
    if (activeFile?.id === fileId) setActiveFile(prev => ({ ...prev, content }));
    setUnsavedFiles(prev => new Set(prev).add(fileId));
  }, [activeFile?.id]);
  
  // 🔥 FIXED: Smart File Creation (Handles both Object & Arguments)
  const handleCreateFileDirect = async (arg1, arg2) => {
    let name, folder;

    // Check: Kya data Object hai (Modal se) ya Arguments (Inline se)?
    if (typeof arg1 === 'object' && arg1 !== null) {
      name = arg1.name;
      folder = arg1.folder;
    } else {
      name = arg1;
      folder = arg2;
    }

    if (!window.electronAPI || !name) return;

    const rootPath = localStorage.getItem('devstudio-last-project');
    if (!rootPath) return toast.error("No project open");

    const isWindows = rootPath.includes('\\');
    const sep = isWindows ? '\\' : '/';

    let targetDir = rootPath;

    // Folder Logic
    if (folder && folder !== 'root') {
        // Agar full path hai (Right click context)
        if (folder.includes(rootPath)) {
            targetDir = folder;
        } else {
            // Agar relative path hai
            // Slashes ko system ke hisab se fix karo
            const normFolder = folder.replace(/\//g, sep).replace(/\\/g, sep);
            // Check karo ki kya rootPath pehle se juda hai
            if (normFolder.startsWith(rootPath)) {
                targetDir = normFolder;
            } else {
                targetDir = `${rootPath}${sep}${normFolder}`;
            }
        }
    }

    const finalPath = `${targetDir}${sep}${name}`;
    console.log("Creating File At:", finalPath); // Debugging

    try {
      const result = await window.electronAPI.createFile(finalPath);
      if (result.success) {
         await handleOpenRecent(rootPath); // Refresh
         toast.success(`Created: ${name}`);
      } else {
         toast.error(result.error);
      }
    } catch (e) { console.error(e); }
  };

  // 🔥 FIXED: Smart Folder Creation
  const handleCreateFolderDirect = async (arg1, arg2) => {
    let name, folder;

    if (typeof arg1 === 'object' && arg1 !== null) {
      name = arg1.name;
      folder = arg1.folder;
    } else {
      name = arg1;
      folder = arg2;
    }

    if (!window.electronAPI || !name) return;

    const rootPath = localStorage.getItem('devstudio-last-project');
    const isWindows = rootPath.includes('\\');
    const sep = isWindows ? '\\' : '/';

    let targetDir = rootPath;

    if (folder && folder !== 'root') {
        if (folder.includes(rootPath)) {
            targetDir = folder;
        } else {
            const normFolder = folder.replace(/\//g, sep).replace(/\\/g, sep);
            if (normFolder.startsWith(rootPath)) {
                targetDir = normFolder;
            } else {
                targetDir = `${rootPath}${sep}${normFolder}`;
            }
        }
    }

    const finalPath = `${targetDir}${sep}${name}`;

    try {
      const result = await window.electronAPI.createFolder(finalPath);
      if (result.success) {
         await handleOpenRecent(rootPath);
         toast.success(`Created: ${name}`);
      } else { toast.error(result.error); }
    } catch (e) { console.error(e); }
  };

  // 🔥 New Simplified Delete Logic
  const promptDeleteFile = (file) => {
    setDeleteTarget({ type: 'file', item: file });
  };
  const promptDeleteFolder = (folder) => {
    setDeleteTarget({ type: 'folder', item: folder });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !window.electronAPI) return;

    const path = deleteTarget.type === 'file' ? deleteTarget.item.realPath : deleteTarget.item.realPath;
    await window.electronAPI.deletePath(path);

    // Refresh Logic
    const rootPath = localStorage.getItem('devstudio-last-project');
    handleOpenRecent(rootPath);

    // Close Tab if needed
    if (deleteTarget.type === 'file') {
       handleTabClose(deleteTarget.item);
    }

    setDeleteTarget(null);
    toast.success("Deleted");
  };
  


  // --- 1. Rename File Logic ---
  const handleRenameFile = async (file, newName) => {
    if (!window.electronAPI || !newName || newName === file.name) return;

    // Windows Path Fix
    const oldPath = file.realPath; // e.g. C:\Users\Project\old.txt

    // Last slash dhundo (chahe \ ho ya /)
    const lastSlash = oldPath.lastIndexOf('\\') !== -1 ? oldPath.lastIndexOf('\\') : oldPath.lastIndexOf('/');

    // Folder ka path nikaalo
    const directory = oldPath.substring(0, lastSlash);

    // Naya path banao
    const newPath = `${directory}\\${newName}`; // Windows ke liye \ use karein

    console.log("Renaming:", oldPath, "->", newPath); // Debugging

    try {
      const result = await window.electronAPI.renamePath(oldPath, newPath);

      if (result.success) {
        // UI Update
        setFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            return {
              ...f,
              name: newName,
              realPath: newPath,
              id: newPath, // ID bhi update karni padegi
              path: f.path.replace(file.name, newName) // UI Path update
            };
          }
          return f;
        }));

        // Agar ye file open hai, to Tab update karo
        if (activeFile?.id === file.id) {
          setActiveFile(prev => ({ ...prev, name: newName, realPath: newPath, id: newPath }));
        }

        // Open Tabs list update karo
        setOpenFiles(prev => prev.map(f => {
           if (f.id === file.id) return { ...f, name: newName, realPath: newPath, id: newPath };
           return f;
        }));

        toast.success("Renamed successfully");
      } else {
        toast.error(`Rename failed: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error renaming file");
    }
  };

  // --- 2. Rename Folder Logic ---
  const handleRenameFolder = async (folder, newName) => {
    if (!window.electronAPI || !newName || newName === folder.name) return;

    const oldPath = folder.realPath;
    const lastSlash = oldPath.lastIndexOf('\\') !== -1 ? oldPath.lastIndexOf('\\') : oldPath.lastIndexOf('/');
    const parentDir = oldPath.substring(0, lastSlash);
    const newPath = `${parentDir}\\${newName}`;

    try {
      const result = await window.electronAPI.renamePath(oldPath, newPath);
      if (result.success) {
        // Sabse asaan tarika: Folder reload karwa lo taki sare paths update ho jayein
        const currentProject = localStorage.getItem('devstudio-last-project');
        if (currentProject) {
            const refresh = await window.electronAPI.openPath(currentProject);
            if (refresh) {
                setFiles(refresh.files);
                setFolders(refresh.folders);
            }
        }
        toast.success("Folder renamed");
      } else {
        toast.error(`Rename failed: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error renaming folder");
    }
  };

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.openFolder();
        if (result) {
          setFiles(result.files); setFolders(result.folders);
          const folderName = result.rootPath.split('\\').pop().split('/').pop();
          setProjectName(folderName.toUpperCase());
          setOpenFiles([]); setActiveFile(null);
          localStorage.setItem('devstudio-last-project', result.rootPath);
          const newRecents = [result.rootPath, ...recentProjects.filter(p => p !== result.rootPath)].slice(0, 5);
          setRecentProjects(newRecents);
          localStorage.setItem('devstudio-recents', JSON.stringify(newRecents));
          toast.success(`Opened: ${folderName}`);
        }
      } catch (error) { console.error(error); }
    }
  };

  const handleOpenRecent = async (path) => {
    if (window.electronAPI) {
      const loadingToast = toast.loading(`Opening ${path}...`);
      const result = await window.electronAPI.openPath(path);
      if (result) {
        setFiles(result.files); setFolders(result.folders);
        const folderName = result.rootPath.split('\\').pop().split('/').pop();
        setProjectName(folderName.toUpperCase());
        setOpenFiles([]); setActiveFile(null);
        const newRecents = [result.rootPath, ...recentProjects.filter(p => p !== result.rootPath)].slice(0, 5);
        setRecentProjects(newRecents);
        localStorage.setItem('devstudio-last-project', result.rootPath);
        localStorage.setItem('devstudio-recents', JSON.stringify(newRecents));
        toast.dismiss(loadingToast); toast.success(`Opened: ${folderName}`);
      } else { toast.dismiss(loadingToast); toast.error("Folder not found"); }
    }
  };

  const handleApplyCode = (code) => {
    if (activeFile) handleContentChange(activeFile.id, code);
  };

  const handleMenuAction = (action, data) => {
    switch (action) {
      case 'newFile': setCreateType('file'); setShowCreateModal(true); break;
      case 'newFolder': setCreateType('folder'); setShowCreateModal(true); break;
      case 'openFolder': handleOpenFolder(); break;
      case 'closeFolder': 
        setFiles([]); setFolders([]); setOpenFiles([]); setActiveFile(null);
        setProjectName('DEVSTUDIO'); localStorage.removeItem('devstudio-last-project');
        window.location.reload(); 
        toast.success("Folder closed");
        break;
      case 'closeWindow': case 'quit': if (window.electronAPI) window.electronAPI.closeWindow(); break;
      case 'viewExplorer': setActiveView('explorer'); setSidebarOpen(true); break;
      case 'viewSearch': setActiveView('search'); setSidebarOpen(true); break;
      case 'viewGit': setActiveView('git'); setSidebarOpen(true); break;
      case 'viewDebug': setActiveView('debug'); setSidebarOpen(true); break;
      case 'viewExtensions': setActiveView('extensions'); setSidebarOpen(true); break;
      case 'viewTerminal': setTerminalOpen(prev => !prev); break;
      case 'commandPalette': setShowCommandPalette(true); break;
      case 'showComingSoon': setComingSoon({ show: true, feature: data }); setTimeout(() => setComingSoon({ show: false, feature: '' }), 3000); break;
      default: break;
    }
  };

  const renderSidebar = () => {
    switch (activeView) {
      case 'explorer':
        return <FileExplorer
          files={files} folders={folders} activeFile={activeFile}
          onFileClick={handleFileClick}

          // 🔥 IMPORTANT: Direct functions pass karein
          onCreateFile={handleCreateFileDirect}
          onCreateFolder={handleCreateFolderDirect}

          onDeleteFile={promptDeleteFile} onDeleteFolder={promptDeleteFolder}
          onRenameFile={handleRenameFile} onRenameFolder={handleRenameFolder}
          projectName={projectName} onOpenFolder={handleOpenFolder}
        />;
      case 'search': return <SearchPanel files={files} onFileClick={handleFileClick} onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} />;
      case 'git': return <GitPanel files={files} onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} rootPath={localStorage.getItem('devstudio-last-project')} />;
      case 'debug': return <DebugPanel onShowComingSoon={(f) => handleMenuAction('showComingSoon', f)} />;
      case 'extensions': return <ExtensionsPanel installedExtensions={installedExtensions} onInstall={(id) => setInstalledExtensions(p => [...p, id])} onUninstall={(id) => setInstalledExtensions(p => p.filter(x => x !== id))} />;
      default: return null;
    }
  };

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
          <MenuBar onAction={handleMenuAction} settings={settings} onSettingToggle={(id) => setSettings(p => ({...p, [id]: !p[id]}))} />
        </div>
        <div className="flex-1 text-center">{activeFile?.name || 'DevStudio'} - DevStudio AI</div>
        <div className="w-20" />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeView={activeView} setActiveView={setActiveView} aiOpen={aiOpen} setAiOpen={setAiOpen} installedExtensions={installedExtensions} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)} onOpenSettings={() => setShowSettingsModal(true)} />
        
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
            
            {/* 🔥 UPPER SECTION: Editor OR Welcome Screen */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeFile ? (
                <CodeEditor
                  file={activeFile}
                  onContentChange={handleContentChange}
                  // 🔥 Pass complete settings object
                  settings={settings}
                  onValidate={(markers) => setProblems(markers)}
                  focusLine={focusLine}
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
                <WebPreview files={files} isOpen={true} onClose={() => setPreviewOpen(false)} onMaximize={() => setPreviewMaximized(!previewMaximized)} isMaximized={previewMaximized} />
              )}
            </div>

            {/* 🔥 BOTTOM SECTION: Terminal (Always Rendered & Persistent) */}
            <div className={cn("border-t border-[#3c3c3c]", !terminalOpen && "hidden")}>
              <Terminal 
                isOpen={true} 
                onToggle={() => setTerminalOpen(!terminalOpen)} 
                onMaximize={() => setTerminalMaximized(!terminalMaximized)} 
                isMaximized={terminalMaximized} 
                problems={problems}
                outputLogs={outputLogs}
                onNavigateProblem={handleNavigateProblem}
              />
            </div>

          </div>
        </div>
        <AIChat isOpen={aiOpen} onClose={() => setAiOpen(false)} activeFile={activeFile} onApplyCode={handleApplyCode} files={files} />
      </div>
      
      <StatusBar activeFile={activeFile} cursorPosition={cursorPosition} previewOpen={previewOpen} onTogglePreview={() => setPreviewOpen(prev => !prev)} terminalOpen={terminalOpen} onToggleTerminal={() => setTerminalOpen(prev => !prev)} />
      
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.item?.name || ''}
        type={deleteTarget?.type || ''}
      />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <TipsModal isOpen={showTips} onClose={() => setShowTips(false)} />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <GoToLineModal isOpen={showGoToLine} onClose={() => setShowGoToLine(false)} onGoToLine={(line) => console.log('Go to line:', line)} maxLine={activeFile?.content?.split('\n').length || 1} />
      <QuickOpenModal isOpen={showQuickOpen} onClose={() => setShowQuickOpen(false)} files={files} onSelect={handleFileClick} />
      <ComingSoonToast isOpen={comingSoon.show} feature={comingSoon.feature} onClose={() => setComingSoon({ show: false, feature: '' })} />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onAction={handleMenuAction} />
      <CreateFileModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setTargetFolder(null); }}
        onCreate={createType === 'file' ? handleCreateFileDirect : handleCreateFolderDirect}
        folders={folders}
        type={createType}
        initialFolder={targetFolder}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg w-11/12 h-5/6 max-w-6xl">
            <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#858585] hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="h-full">
              <SettingsPanel
                settings={settings}
                onSettingChange={handleSettingChange}
                onSave={saveSettings}
                unsaved={settingsUnsaved}
                onViewChange={(view) => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Unsaved Changes</h3>
            <p className="text-[#cccccc] mb-6">You have unsaved settings changes. Do you want to save them before closing?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 bg-[#3c3c3c] text-white rounded hover:bg-[#454545]"
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseWithoutSaving}
                className="px-4 py-2 bg-[#ff5f56] text-white rounded hover:bg-[#e54b42]"
              >
                Don't Save
              </button>
              <button
                onClick={() => {
                  saveSettings();
                  setShowUnsavedWarning(false);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005a9e]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
