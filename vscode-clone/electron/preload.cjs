const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File System (Same)
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openPath: (path) => ipcRenderer.invoke('fs:openPath', path),
  saveFile: (path, content) => ipcRenderer.invoke('fs:saveFile', { path, content }),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  deletePath: (path) => ipcRenderer.invoke('fs:deletePath', path),
  renamePath: (oldPath, newPath) => ipcRenderer.invoke('fs:renamePath', { oldPath, newPath }),
  createFolder: (path) => ipcRenderer.invoke('fs:createFolder', path),
  createFile: (path) => ipcRenderer.invoke('fs:createFile', path),
  searchFiles: (rootPath, query) => ipcRenderer.invoke('fs:search', { rootPath, query }),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // Watcher
  onFileChanged: (callback) => {
    ipcRenderer.on('fs:changed', callback);
    return () => ipcRenderer.removeListener('fs:changed', callback);
  },

  // 🔥 NEW MULTI-TERMINAL API
  createTerminal: (cwd) => ipcRenderer.invoke('terminal:create', cwd),
  
  writeTerminal: (id, data) => ipcRenderer.invoke('terminal:write', { id, data }),
  
  resizeTerminal: (id, dims) => ipcRenderer.invoke('terminal:resize', { id, ...dims }),
  
  killTerminal: (id) => ipcRenderer.invoke('terminal:kill', id),
  
  onTerminalData: (callback) => {
    const subscription = (event, { id, data }) => callback(id, data);
    ipcRenderer.on('terminal:incomingData', subscription);
    return () => ipcRenderer.removeListener('terminal:incomingData', subscription);
  },

  // 🔥 NEW: Execute Command
  execCommand: (command) => ipcRenderer.invoke('terminal:execCommand', command),

  // 🔥 GIT API
  getGitStatus: (cwd) => ipcRenderer.invoke('git:status', cwd),
  gitCommit: (cwd, message) => ipcRenderer.invoke('git:commit', { cwd, message }),
  gitPush: (cwd) => ipcRenderer.invoke('git:push', cwd),
  gitPull: (cwd) => ipcRenderer.invoke('git:pull', cwd),
});