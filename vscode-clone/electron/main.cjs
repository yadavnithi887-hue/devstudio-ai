const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const pty = require('node-pty');
const chokidar = require('chokidar');
const { exec } = require('child_process');

// API Call Libraries (For Extensions)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const liveServer = require('live-server');
const prettier = require('prettier');

let mainWindow;
let terminals = {};
let fileWatcher = null;
let serverInstance = null;

// --- Helper: Path Normalizer ---
const normalizePath = (p) => p.replace(/\\/g, '/');

// --- 1. Terminal Logic ---
function createTerminal(cwdPath) {
  const targetPath = cwdPath && fs.existsSync(cwdPath) ? cwdPath : os.homedir();
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const id = Date.now().toString(); 
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: targetPath,
    env: process.env
  });

  terminals[id] = ptyProcess;
  
  ptyProcess.on('data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:incomingData', { id, data });
    }
  });
  
  ptyProcess.on('exit', () => { delete terminals[id]; });

  return id;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, backgroundColor: '#1e1e1e', title: 'DevStudio AI',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') },
  });
  mainWindow.loadURL('http://localhost:5173');
}

// --- IPC HANDLERS ---

// --- Terminal Handlers ---
ipcMain.handle('terminal:create', (event, cwd) => createTerminal(cwd));
ipcMain.handle('terminal:write', (event, { id, data }) => { if (terminals[id]) terminals[id].write(data); });
ipcMain.handle('terminal:resize', (event, { id, cols, rows }) => { if (terminals[id]) try { terminals[id].resize(cols, rows); } catch(e){} });
ipcMain.handle('terminal:kill', (event, id) => { if (terminals[id]) { terminals[id].kill(); delete terminals[id]; } });

// --- File System Watcher ---
function startWatching(folderPath) {
  if (fileWatcher) fileWatcher.close();
  fileWatcher = chokidar.watch(folderPath, { ignored: /(^|[\/\\])\..|node_modules|.git/, persistent: true, ignoreInitial: true });
  fileWatcher.on('all', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('fs:changed'); });
}

// --- File System Handlers ---
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

function readDirectoryRecursively(dirPath, rootPath) {
  let fileList = [], folderList = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const normalizedPath = normalizePath(fullPath);
      const relativePath = normalizePath(path.relative(rootPath, fullPath));
      const parentFolder = normalizePath(path.dirname(relativePath));
      
      if (['node_modules', '.git', 'dist'].includes(entry.name)) return;
      
      if (entry.isDirectory()) {
        folderList.push({ name: entry.name, path: relativePath, realPath: normalizedPath });
        const sub = readDirectoryRecursively(fullPath, rootPath);
        fileList = [...fileList, ...sub.files];
        folderList = [...folderList, ...sub.folders];
      } else {
        fileList.push({ id: normalizedPath, name: entry.name, path: relativePath, folder: parentFolder === '.' ? '' : parentFolder, realPath: normalizedPath, content: '' });
      }
    });
  } catch (e) {}
  return { files: fileList, folders: folderList };
}

ipcMain.handle('fs:readFile', async (e, p) => { try { return fs.readFileSync(p, 'utf-8'); } catch { return ''; } });
ipcMain.handle('fs:saveFile', async (e, { path, content }) => { try { fs.writeFileSync(path, content, 'utf-8'); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:createFile', async (e, p) => { try { if (fs.existsSync(p)) return { success: false, error: 'Exists' }; fs.writeFileSync(p, '', 'utf-8'); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:createFolder', async (e, p) => { try { if (!fs.existsSync(p)) fs.mkdirSync(p); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:deletePath', async (e, p) => { try { fs.rmSync(p, { recursive: true, force: true }); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('fs:renamePath', async (e, { oldPath, newPath }) => { try { fs.renameSync(oldPath, newPath); return { success: true }; } catch (err) { return { success: false }; } });
ipcMain.handle('window:close', () => mainWindow.close());

// --- Git Handlers ---
// --- 🔥 GIT HANDLERS (Full & Final Code) ---

// 1. Get Detailed Status (Staged, Unstaged, Branch, Remote)
ipcMain.handle('git:status', async (event, cwd) => {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(cwd, '.git'))) {
      resolve({ isRepo: false, files: [], branch: '', hasRemote: false });
      return;
    }

    // Command to get branch and remote in one go
    const command = 'git branch --show-current && git remote -v';

    exec(command, { cwd }, (err, stdout) => {
      const output = stdout.split('\n');
      const currentBranch = output[0] ? output[0].trim() : 'HEAD';
      const hasRemote = output.length > 1 && output[1].trim() !== '';

      // Get File Status
      exec('git status --porcelain', { cwd }, (error, stdoutStatus) => {
        if (error) { resolve({ isRepo: true, files: [], branch: currentBranch, hasRemote }); return; }

        const files = stdoutStatus.split('\n').filter(line => line.trim() !== '').map(line => {
          let fileName = line.substring(3).trim();
          if (fileName.startsWith('"') && fileName.endsWith('"')) fileName = fileName.slice(1, -1);
          
          const statusCode = line.substring(0, 2);
          const isStaged = statusCode[0] !== ' ' && statusCode[0] !== '?';
          let status = 'M';
          if (statusCode.includes('??')) status = 'U';
          else if (statusCode.includes('D')) status = 'D';
          else if (statusCode.includes('A')) status = 'A';
          return { path: fileName, status, staged: isStaged };
        });

        resolve({ isRepo: true, files, branch: currentBranch, hasRemote });
      });
    });
  });
});

// 2. Initialize Repo
ipcMain.handle('git:init', async (event, cwd) => {
  return new Promise(r => exec('git init', { cwd }, (e) => r({ success: !e })));
});

// 3. Stage & Unstage
ipcMain.handle('git:stage', async (event, { cwd, file }) => {
  return new Promise(r => exec(`git add "${file}"`, { cwd }, (e) => r(!e)));
});
ipcMain.handle('git:unstage', async (event, { cwd, file }) => {
  const cmd = file === '.' ? 'git restore --staged .' : `git restore --staged "${file}"`;
  return new Promise(r => exec(cmd, { cwd }, (e) => r(!e)));
});

// 4. Commit
ipcMain.handle('git:commit', async (event, { cwd, message }) => {
  return new Promise(r => exec(`git commit -m "${message}"`, { cwd }, (e) => r({ success: !e, error: e?.message })));
});

// 5. Branch Management
ipcMain.handle('git:getBranches', async (event, cwd) => {
  return new Promise(r => exec('git branch -a', { cwd }, (e, out) => r(e ? [] : [...new Set(out.split('\n').map(b=>b.trim().replace('* ','')).filter(b=>b&&!b.includes('->')).map(b=>b.replace('remotes/origin/','')))])));
});
ipcMain.handle('git:checkout', async (event, { cwd, branch }) => {
  return new Promise(r => exec(`git checkout "${branch}"`, { cwd }, (e) => r({ success: !e })));
});
ipcMain.handle('git:createBranch', async (event, { cwd, branch }) => {
  return new Promise(r => exec(`git checkout -b "${branch}"`, { cwd }, (e) => r({ success: !e })));
});

// 6. Push & Pull
ipcMain.handle('git:push', async (event, cwd, token) => {
  return new Promise((resolve) => {
    exec('git remote get-url origin', { cwd }, (err, url) => {
       if(err || !url) { resolve({ success: false, error: 'No remote found' }); return; }
       let repoUrl = url.trim();
       if(token && repoUrl.startsWith('https://github.com/')) repoUrl = repoUrl.replace('https://', `https://${token}@`);
       exec(`git push "${repoUrl}"`, { cwd }, (error) => resolve({ success: !error, error: error?.message }));
    });
  });
});
ipcMain.handle('git:pull', async (event, cwd) => {
  return new Promise(r => exec('git pull', { cwd }, (e) => r({ success: !e, error: e?.message })));
});

// 7. Publish to GitHub
ipcMain.handle('git:publish', async (event, { cwd, token, repoName, isPrivate, files }) => {
  return new Promise(async (resolve) => {
    try {
        const userResp = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!userResp.ok) { resolve({ success: false, error: 'Invalid Token' }); return; }
        const userData = await userResp.json();
        
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: repoName, private: isPrivate })
        });
        
        const data = await response.json();
        let remoteUrl = "";
        if (response.ok) remoteUrl = data.clone_url.replace('https://', `https://${token}@`);
        else if (data.errors && data.errors[0]?.message === 'name already exists on this account') remoteUrl = `https://${token}@github.com/${userData.login}/${repoName}.git`;
        else { resolve({ success: false, error: data.message }); return; }

        const sanitizedFiles = files.map(f => (f.endsWith('/') || f.endsWith('\\')) ? f.slice(0, -1) : f);
        for (const file of sanitizedFiles) { try { const g = path.join(cwd, file, '.git'); if (fs.existsSync(g)) fs.rmSync(g, { recursive: true, force: true }); } catch(e){} }
        
        const addCmd = sanitizedFiles.length > 0 ? `git add "${sanitizedFiles.join('" "')}"` : `git add .`;
        const commands = ['git init', addCmd, 'git commit -m "Initial commit"', 'git branch -M main', `git remote add origin "${remoteUrl}" || git remote set-url origin "${remoteUrl}"`, 'git push -u origin main'];
        
        const run = (cmd) => new Promise((res, rej) => exec(cmd, { cwd }, (err) => (err && !err.message.includes('warning') && !err.message.includes('exists')) ? rej(err) : res()));
        
        for(const cmd of commands) await run(cmd);
        resolve({ success: true });
    } catch(e) { resolve({ success: false, error: e.message }); }
  });
});
// --- 🔥 EXTENSION HANDLERS ---
// 1. Live Server
ipcMain.handle('ext:live-server:start', async (event, rootPath) => {
  if (serverInstance) liveServer.shutdown();
  if(!rootPath) return { success: false, error: 'No root path' };
  serverInstance = liveServer.start({ port: 5500, root: rootPath, open: true });
  return { success: true, url: `http://localhost:5500` };
});
ipcMain.handle('ext:live-server:stop', async () => { if (serverInstance) liveServer.shutdown(); return { success: true }; });

// 2. Prettier
ipcMain.handle('ext:prettier:format', async (event, { code, filePath }) => {
  try {
    const formatted = await prettier.format(code, { filepath: filePath });
    return { success: true, formatted };
  } catch (err) { return { success: false, error: err.message }; }
});

// Main App Lifecycle
app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });