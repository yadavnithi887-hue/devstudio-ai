/**
 * Prettier Formatter Extension
 * Auto-formats code using Prettier
 */

export const metadata = {
  id: 'prettier-formatter',
  name: 'Prettier Formatter',
  version: '1.0.0',
  description: 'Code formatter using Prettier',
  author: 'DevStudio Team'
};

export function activate(context) {
  console.log('✨ Prettier: Activating...');

  // ✅ Register format command
  context.registerCommand('prettier.format', async () => {
    console.log('✨ Prettier: Formatting code...');

    // Check if Electron API is available
    if (!window.electronAPI || !window.electronAPI.formatWithPrettier) {
      context.window.showErrorMessage('Prettier not available (Electron API missing)');
      return;
    }

    // Get current file from context
    // NOTE: We need to get this from the active editor
    // For now, we'll use a workaround with window.activeFile
    const activeFile = getActiveFile();

    if (!activeFile || !activeFile.content) {
      context.window.showWarningMessage('No file is currently open or file is empty');
      return;
    }

    // Show loading message
    context.window.showInformationMessage('Formatting code...');

    try {
      const settings = context.getSettings();
      
      const result = await window.electronAPI.formatWithPrettier({
        code: activeFile.content,
        filePath: activeFile.realPath || activeFile.path || activeFile.name,
        options: {
          tabWidth: settings.tabSize || 2,
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 80
        }
      });

      if (result.success) {
        // Update editor content
        updateEditorContent(result.formatted);
        context.window.showInformationMessage('✅ Code formatted successfully!');
      } else {
        context.window.showErrorMessage(`❌ Format failed: ${result.error}`);
        console.error('Prettier error:', result.error);
      }
    } catch (err) {
      console.error('Prettier error:', err);
      context.window.showErrorMessage('Format error: ' + err.message);
    }
  });

  // ✅ Register editor button
  context.window.registerEditorButton({
    id: 'prettier.formatButton',
    label: 'Format',
    icon: '✨',
    tooltip: 'Format document with Prettier (Ctrl+Shift+F)',
    command: 'prettier.format',
    position: 'right'
  });

  // ✅ Register keyboard shortcut listener
  registerKeyboardShortcut();

  console.log('✅ Prettier: Activated');
}

// Helper: Get active file from DOM/Window
function getActiveFile() {
  // This is a workaround - in production, context should provide this
  // For now, we'll try to get it from window
  if (window.__activeFile) {
    return window.__activeFile;
  }

  // Try to get from React DevTools or global state
  try {
    // Look for Monaco editor instance
    const editor = window.monaco?.editor?.getModels?.()?.[0];
    if (editor) {
      return {
        content: editor.getValue(),
        path: editor.uri?.path || 'untitled.js',
        name: editor.uri?.path?.split('/').pop() || 'untitled.js'
      };
    }
  } catch (e) {
    console.error('Error getting active file:', e);
  }

  return null;
}

// Helper: Update editor content
function updateEditorContent(newContent) {
  // Dispatch custom event that Layout can listen to
  window.dispatchEvent(new CustomEvent('prettier:formatted', {
    detail: { content: newContent }
  }));

  // Also try to update Monaco directly if available
  try {
    const editor = window.monaco?.editor?.getModels?.()?.[0];
    if (editor) {
      editor.setValue(newContent);
    }
  } catch (e) {
    console.error('Error updating editor:', e);
  }
}

// Helper: Register keyboard shortcut
function registerKeyboardShortcut() {
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+F or Cmd+Shift+F
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      
      // Trigger format command
      if (window.registry) {
        window.registry.executeCommand('prettier.format');
      }
    }
  });
}

export function deactivate() {
  console.log('✨ Prettier: Deactivating...');
}