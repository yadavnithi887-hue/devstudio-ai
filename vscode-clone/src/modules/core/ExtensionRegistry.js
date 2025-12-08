import * as GeminiAI from '../extensions/gemini-ai';
import * as PrettierFormatter from '../extensions/prettier-formatter';
import * as LiveServer from '../extensions/live-server';
import * as AIHistoryChat from '../extensions/ai-history-chat';

class ExtensionRegistry {
  constructor() {
    this.extensions = [
      GeminiAI,
      PrettierFormatter,
      LiveServer,
      AIHistoryChat
    ];
    
    // Core registries
    this.commands = new Map();
    this.sidebarItems = [];
    this.sidebarPanels = new Map();
    this.settingsSchema = [];
    
    // ✅ Store actual UI items (not just callbacks)
    this.statusBarItems = [];
    this.editorButtons = [];
    
    // ✅ Callbacks for real-time updates
    this.statusBarCallbacks = [];
    this.editorButtonCallbacks = [];
    
    // ✅ Initialization flag
    this.initialized = false;
  }

  initialize(context) {
    console.log("🚀 Initializing Internal Extensions...");

    // ✅ Clear everything on re-initialization
    this.commands.clear();
    this.sidebarItems = [];
    this.sidebarPanels.clear();
    this.settingsSchema = [];
    this.statusBarItems = [];
    this.editorButtons = [];
    // ⚠️ Don't clear callbacks - they're from Layout

    this.extensions.forEach(ext => {
      if (!ext.metadata) {
        console.warn(`Extension missing metadata:`, ext);
        return;
      }
      
      console.log(`📦 Loading: ${ext.metadata.name}`);

      // Load settings schema
      if (ext.settings) {
        this.settingsSchema.push(...ext.settings);
      }

      // Activate extension
      if (ext.activate) {
        try {
          const extContext = {
            ...context,

            // ✅ Register commands
            registerCommand: (id, fn) => {
              console.log(`  ✓ Command registered: ${id}`);
              this.commands.set(id, fn);
            },

            // ✅ Register sidebar panels
            registerSidebarPanel: (id, item, component) => {
              console.log(`  ✓ Sidebar panel registered: ${id}`);
              this.sidebarItems.push({ id, ...item });
              this.sidebarPanels.set(id, component);
            },

            // ✅ Window API for UI elements
            window: {
              showInformationMessage: (msg) => context.toast.success(msg),
              showWarningMessage: (msg) => context.toast.warning(msg),
              showErrorMessage: (msg) => context.toast.error(msg),
                  
              // ✅ Create status bar item
              createStatusBarItem: (item) => {
                console.log(`  ✓ Status bar item created:`, item);
                
                // Store the item
                this.statusBarItems.push(item);
                
                // Notify all listeners immediately
                this.statusBarCallbacks.forEach(cb => {
                  try {
                    cb(item);
                  } catch (e) {
                    console.error('Error in statusBar callback:', e);
                  }
                });
              },

              // ✅ Register editor button
              registerEditorButton: (btn) => {
                console.log(`  ✓ Editor button registered:`, btn);
                
                // Store the button
                this.editorButtons.push(btn);
                
                // Notify all listeners immediately
                this.editorButtonCallbacks.forEach(cb => {
                  try {
                    cb(btn);
                  } catch (e) {
                    console.error('Error in editorButton callback:', e);
                  }
                });
              }
            }
          };
            
          ext.activate(extContext);
          console.log(`  ✅ ${ext.metadata.name} activated successfully`);

        } catch (e) {
          console.error(`❌ Failed to activate ${ext.metadata.name}:`, e);
        }
      }
    });

    this.initialized = true;
    console.log("✅ All extensions initialized");
  }

  // ✅ Get current data
  getCommands() { 
    return this.commands; 
  }

  getSidebarItems() { 
    return this.sidebarItems; 
  }

  getSidebarPanel(id) { 
    return this.sidebarPanels.get(id); 
  }

  getSettings() { 
    return this.settingsSchema; 
  }

  getStatusBarItems() {
    return this.statusBarItems;
  }

  getEditorButtons() {
    return this.editorButtons;
  }
  
  // ✅ Execute command
  executeCommand(id, args) {
    if (this.commands.has(id)) {
      try {
        console.log(`⚡ Executing command: ${id}`);
        this.commands.get(id)(args);
      } catch (e) {
        console.error(`Error executing command ${id}:`, e);
      }
    } else {
      console.warn(`⚠️ Command not found: ${id}`);
    }
  }

  // ✅ Register listeners with initial data
  onStatusBarUpdate(callback) {
    console.log('📡 Status bar listener registered');
    this.statusBarCallbacks.push(callback);

    // ✅ Send existing items immediately (if already initialized)
    if (this.initialized) {
      console.log(`  → Sending ${this.statusBarItems.length} existing items`);
      this.statusBarItems.forEach(item => {
        try {
          callback(item);
        } catch (e) {
          console.error('Error sending existing statusBar item:', e);
        }
      });
    }

    // Return cleanup function
    return () => {
      console.log('📡 Status bar listener removed');
      this.statusBarCallbacks = this.statusBarCallbacks.filter(
        cb => cb !== callback
      );
    };
  }

  onEditorButtonUpdate(callback) {
    console.log('📡 Editor button listener registered');
    this.editorButtonCallbacks.push(callback);

    // ✅ Send existing buttons immediately (if already initialized)
    if (this.initialized) {
      console.log(`  → Sending ${this.editorButtons.length} existing buttons`);
      this.editorButtons.forEach(btn => {
        try {
          callback(btn);
        } catch (e) {
          console.error('Error sending existing editorButton:', e);
        }
      });
    }

    // Return cleanup function
    return () => {
      console.log('📡 Editor button listener removed');
      this.editorButtonCallbacks = this.editorButtonCallbacks.filter(
        cb => cb !== callback
      );
    };
  }
}

export const registry = new ExtensionRegistry();