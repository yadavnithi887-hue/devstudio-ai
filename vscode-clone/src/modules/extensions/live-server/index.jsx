import { Server, ServerOff } from 'lucide-react'; // Better icons

export const metadata = {
  id: 'devstudio.live-server',
  name: 'Live Server',
  description: 'Launch a local development server for static pages.'
};

let serverRunning = false;

export const activate = (context) => {
  const { toast, electronAPI, getWorkspaceRoot } = context;

  // Function to Update Status Bar Button
  const updateStatusBar = (isRunning, port = null) => {
      context.window.createStatusBarItem({
          id: 'live-server-btn',
          text: isRunning ? `🌐 Port: ${port}` : 'Go Live',
          command: isRunning ? 'liveServer.stop' : 'liveServer.start',
          tooltip: isRunning ? 'Click to stop live server' : 'Click to start live server',
          color: isRunning ? '#34d399' : '#cccccc' // Green if running
      });
  };

  // 1. Start Command
  context.registerCommand('liveServer.start', async () => {
    if (serverRunning) return toast.warning("Server is already running!");
    
    // 🔥 FIX: Get Root Path from Context
    const root = getWorkspaceRoot();
    if (!root) return toast.error("Please open a folder first!");

    toast.info("Starting live server...");
    
    // Call Backend
    const res = await electronAPI.startLiveServer(root);
    
    if (res.success) {
      serverRunning = true;
      updateStatusBar(true, res.port);
      toast.success(`Server is live at http://localhost:${res.port}`);
    } else {
      toast.error(`Failed to start server: ${res.error}`);
    }
  });

  // 2. Stop Command
  context.registerCommand('liveServer.stop', async () => {
    if (!serverRunning) return toast.warning("Server is not running.");
    
    await electronAPI.stopLiveServer();
    serverRunning = false;
    updateStatusBar(false);
    toast.info("Live server stopped.");
  });

  // Initial Button
  updateStatusBar(false);

  console.log("🌐 Live Server Extension Active!");
};