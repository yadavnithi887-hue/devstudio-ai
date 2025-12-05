const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const pty = require('node-pty');
const chokidar = require('chokidar');
const { spawn, exec } = require('child_process');

let mainWindow;
let terminals = {}; // Multi-terminal store

const normalizePath = (p) => p.replace(/\\/g, '/');

// --- 1. Terminal Creator (Always Active Logic) ---
function createTerminal(cwdPath) {
  // Agar path nahi diya, to User Home Directory use karo (Default PC Path)
  const targetPath = cwdPath && fs.existsSync(cwdPath) ? cwdPath : os.homedir();

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const id = Date.now().toString(); 

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: targetPath, // 🔥 Always Valid Path
    env: process.env
  });

  terminals[id] = ptyProcess;

  ptyProcess.on('data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:incomingData', { id, data });
    }
  });
  
  ptyProcess.on('exit', () => {
    delete terminals[id];
  });

  return id;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, backgroundColor: '#1e1e1e', title: 'DevStudio AI',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') },
  });

  mainWindow.loadURL('http://localhost:5173');
}

// --- IPC Handlers ---

// 1. Create Terminal Request (Frontend se)
ipcMain.handle('terminal:create', (event, cwd) => {
  return createTerminal(cwd);
});

// 2. Write to Terminal
ipcMain.handle('terminal:write', (event, { id, data }) => {
  if (terminals[id]) terminals[id].write(data);
});

// 3. Resize Terminal
ipcMain.handle('terminal:resize', (event, { id, cols, rows }) => {
  if (terminals[id]) {
    try { terminals[id].resize(cols, rows); } catch(e){}
  }
});

// 4. Kill Terminal
ipcMain.handle('terminal:kill', (event, id) => {
  if (terminals[id]) {
    terminals[id].kill();
    delete terminals[id];
  }
});

// --- File System ---

ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (canceled) return null;
  const rootPath = filePaths[0];
  
  startWatching(rootPath);
  const data = readDirectoryRecursively(rootPath, rootPath);
  return { ...data, rootPath: normalizePath(rootPath) };
});

ipcMain.handle('fs:openPath', async (e, p) => {
  if (!fs.existsSync(p)) return null;
  startWatching(p);
  const data = readDirectoryRecursively(p, p);
  return { ...data, rootPath: normalizePath(p) };
});

// Watcher
let fileWatcher = null;
function startWatching(folderPath) {
  if (fileWatcher) fileWatcher.close();
  fileWatcher = chokidar.watch(folderPath, { ignored: /(^|[\/\\])\..|node_modules|.git/, persistent: true, ignoreInitial: true });
  fileWatcher.on('all', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('fs:changed'); });
}

// Helper: Read Files
function readDirectoryRecursively(dirPath, rootPath) {
  let fileList = [], folderList = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const normalizedPath = normalizePath(fullPath);
      const relativePath = normalizePath(path.relative(rootPath, fullPath));
      if (['node_modules', '.git', 'dist', '.vscode'].includes(entry.name)) return;
      if (entry.isDirectory()) {
        folderList.push({ name: entry.name, path: relativePath, realPath: normalizedPath });
        const sub = readDirectoryRecursively(fullPath, rootPath);
        fileList = [...fileList, ...sub.files];
        folderList = [...folderList, ...sub.folders];
      } else {
        // Extract folder from relativePath (remove filename)
        const folder = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '';
        fileList.push({ id: normalizedPath, name: entry.name, path: relativePath, folder: folder, realPath: normalizedPath, content: '', language: 'javascript' });
      }
    });
  } catch (e) {}
  return { files: fileList, folders: folderList };
}

// File Operations
ipcMain.handle('fs:readFile', async (e, p) => { try { return fs.readFileSync(p, 'utf-8'); } catch { return ''; } });
ipcMain.handle('fs:saveFile', async (e, { path, content }) => { try { fs.writeFileSync(path, content, 'utf-8'); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:deletePath', async (e, p) => { try { fs.rmSync(p, { recursive: true, force: true }); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:renamePath', async (e, { oldPath, newPath }) => { try { fs.renameSync(oldPath, newPath); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:createFolder', async (e, p) => { try { if (!fs.existsSync(p)){ fs.mkdirSync(p); } return { success: true }; } catch (err) { return { success: false, error: err.message }; } });

// 🔥 NEW: Create File Handler
ipcMain.handle('fs:createFile', async (event, fullPath) => {
  try {
    if (fs.existsSync(fullPath)) return { success: false, error: 'File already exists!' };
    fs.writeFileSync(fullPath, '', 'utf-8');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

// 🔥 NEW: Execute Command Handler
ipcMain.handle('terminal:execCommand', async (event, command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ stdout, stderr, error: error ? error.message : null });
    });
  });
});

// --- 🔥 GIT HANDLERS (Real Implementation) ---

// 1. Get Status (Changed Files)
ipcMain.handle('git:status', async (event, cwd) => {
  return new Promise((resolve) => {
    // Check if .git exists
    if (!fs.existsSync(path.join(cwd, '.git'))) {
      resolve({ isRepo: false, files: [] });
      return;
    }

    // Run git status --porcelain (Machine readable format)
    exec('git status --porcelain', { cwd }, (error, stdout) => {
      if (error) {
        resolve({ isRepo: true, files: [] }); // No changes or error
        return;
      }

      const files = stdout.split('\n').filter(line => line.trim() !== '').map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3).trim();
        
        let type = 'modified';
        if (status.includes('??')) type = 'untracked';
        else if (status.includes('D')) type = 'deleted';
        else if (status.includes('A')) type = 'added';
        
        return { path: file, status: type, staged: status[0] !== ' ' && status[0] !== '?' };
      });

      resolve({ isRepo: true, files });
    });
  });
});

// 2. Commit
ipcMain.handle('git:commit', async (event, { cwd, message }) => {
  return new Promise((resolve) => {
    // Add all (.) then commit
    exec(`git add . && git commit -m "${message}"`, { cwd }, (error) => {
      resolve({ success: !error, error: error ? error.message : null });
    });
  });
});

// 3. Push
ipcMain.handle('git:push', async (event, cwd) => {
  return new Promise((resolve) => {
    exec('git push', { cwd }, (error) => {
      resolve({ success: !error, error: error ? error.message : null });
    });
  });
});

// 4. Pull
ipcMain.handle('git:pull', async (event, cwd) => {
  return new Promise((resolve) => {
    exec('git pull', { cwd }, (error) => {
      resolve({ success: !error, error: error ? error.message : null });
    });
  });
});

// 🔥 REAL SEARCH LOGIC
ipcMain.handle('fs:search', async (event, { rootPath, query }) => {
  if (!rootPath || !query) return [];

  const results = [];

  function searchRecursive(dir) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (['node_modules', '.git', 'dist'].includes(file.name)) continue;

        if (file.isDirectory()) {
          searchRecursive(fullPath);
        } else {
          // Only read text files
          const ext = path.extname(file.name).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt'].includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');

              lines.forEach((line, index) => {
                if (line.includes(query)) {
                  results.push({
                    file: file.name,
                    path: normalizePath(fullPath),
                    line: index + 1,
                    content: line.trim()
                  });
                }
              });
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  searchRecursive(rootPath);
  return results; // Max 100 results return karna better hoga performance ke liye
});

ipcMain.handle('window:close', () => mainWindow.close());

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });