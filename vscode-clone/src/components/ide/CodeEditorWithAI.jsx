// src/components/ide/CodeEditorWithAI.jsx
import React, { useRef, useEffect, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Sparkles, Settings, Check, X, Loader2 } from 'lucide-react';
import { 
  AICodeGenerator, 
  AISettingsManager, 
  ProjectContextBuilder,
  CodeParser 
} from '../../lib/aiCodingService';

loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
});

export default function CodeEditorWithAI({
  file,
  files = [],
  onContentChange,
  settings,
  onValidate,
  focusLine,
  extensionButtons = [],
  onExtensionButtonClick
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [aiSettings, setAiSettings] = useState(AISettingsManager.getSettings());
  const [showAISettings, setShowAISettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [diffDecorations, setDiffDecorations] = useState([]);

  const getLanguage = (filename) => {
    if (!filename) return 'javascript';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      css: 'css', html: 'html', json: 'json', md: 'markdown', py: 'python',
      java: 'java', cpp: 'cpp', c: 'c', sql: 'sql', go: 'go', rs: 'rust'
    };
    return map[ext] || 'plaintext';
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('devstudio-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2a2d2e'
      }
    });

    monaco.editor.setTheme('devstudio-dark');

    // Add AI Command
    editor.addAction({
      id: 'ai-generate-code',
      label: 'AI: Generate Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      contextMenuGroupId: 'ai',
      run: () => {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        if (selectedText) {
          setAiPrompt(`Modify this code: ${selectedText}`);
        }
        document.getElementById('ai-prompt-input')?.focus();
      }
    });

    monaco.editor.onDidChangeMarkers(() => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const formattedProblems = markers.map(m => ({
          file: file.name,
          message: m.message,
          line: m.startLineNumber,
          severity: m.severity === 8 ? 'Error' : 'Warning',
          source: m.source || 'TS/JS'
        }));
        if (onValidate) onValidate(formattedProblems);
      }
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers,
        cursorBlinking: settings.cursorBlinking,
        tabSize: settings.tabSize
      });
    }
  }, [settings]);

  useEffect(() => {
    if (editorRef.current && focusLine) {
      editorRef.current.revealLineInCenter(focusLine);
      editorRef.current.setPosition({ lineNumber: focusLine, column: 1 });
      editorRef.current.focus();
    }
  }, [focusLine, file?.id]);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    if (!aiSettings.apiKey) {
      alert('Please add API key in AI settings');
      setShowAISettings(true);
      return;
    }

    setIsGenerating(true);

    const context = ProjectContextBuilder.buildContext(files, file);
    const generator = new AICodeGenerator(
      aiSettings.provider,
      aiSettings.apiKey,
      aiSettings.model
    );

    try {
      const response = await generator.generateCode(aiPrompt, context);
      const parsed = CodeParser.parseAIResponse(response);

      if (parsed.operations.length > 0) {
        const fileOp = parsed.operations.find(op => op.type === 'file');
        if (fileOp) {
          const newCode = fileOp.content;
          
          // Check if project is empty or auto-apply is enabled
          if (aiSettings.autoApply || files.length === 0) {
            applyCode(newCode);
          } else {
            setPendingCode(newCode);
            showDiffHighlight(file.content, newCode);
          }
        }
      } else {
        // Extract code from markdown blocks
        const blocks = CodeParser.extractCodeBlocks(response);
        if (blocks.length > 0) {
          const newCode = blocks[0].code;
          
          if (aiSettings.autoApply || files.length === 0) {
            applyCode(newCode);
          } else {
            setPendingCode(newCode);
            showDiffHighlight(file.content, newCode);
          }
        }
      }
    } catch (error) {
      alert(`AI Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const showDiffHighlight = (oldCode, newCode) => {
    if (!monacoRef.current || !editorRef.current) return;

    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const decorations = [];

    // Simple line-by-line diff
    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (i < oldLines.length && i >= newLines.length) {
        // Line removed
        decorations.push({
          range: new monacoRef.current.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            className: 'ai-diff-removed',
            glyphMarginClassName: 'ai-diff-removed-glyph',
            minimap: { color: '#ff000040', position: 2 }
          }
        });
      } else if (i >= oldLines.length && i < newLines.length) {
        // Line added (can't show yet as it doesn't exist)
      } else if (oldLines[i] !== newLines[i]) {
        // Line modified
        decorations.push({
          range: new monacoRef.current.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            className: 'ai-diff-modified',
            glyphMarginClassName: 'ai-diff-modified-glyph',
            minimap: { color: '#ffaa0040', position: 2 }
          }
        });
      }
    }

    const decorationIds = editorRef.current.deltaDecorations([], decorations);
    setDiffDecorations(decorationIds);

    // Inject custom CSS for diff highlighting
    injectDiffStyles();
  };

  const injectDiffStyles = () => {
    if (document.getElementById('ai-diff-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-diff-styles';
    style.textContent = `
      .ai-diff-removed {
        background-color: rgba(255, 0, 0, 0.2) !important;
        opacity: 0.6;
      }
      .ai-diff-removed-glyph {
        background-color: #ff0000 !important;
      }
      .ai-diff-modified {
        background-color: rgba(255, 170, 0, 0.2) !important;
      }
      .ai-diff-modified-glyph {
        background-color: #ffaa00 !important;
      }
      .ai-diff-added {
        background-color: rgba(0, 255, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  };

  const applyCode = (newCode) => {
    onContentChange(file.id, newCode);
    setPendingCode(null);
    
    if (diffDecorations.length > 0) {
      editorRef.current?.deltaDecorations(diffDecorations, []);
      setDiffDecorations([]);
    }
  };

  const rejectCode = () => {
    setPendingCode(null);
    if (diffDecorations.length > 0) {
      editorRef.current?.deltaDecorations(diffDecorations, []);
      setDiffDecorations([]);
    }
  };

  if (!file) return <div className="flex-1 bg-[#1e1e1e]" />;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#1e1e1e] relative">
      
      {/* Extension Buttons */}
      {extensionButtons && extensionButtons.length > 0 && (
        <div className="bg-[#2d2d2d] border-b border-[#3c3c3c] px-3 py-1 flex items-center gap-2">
          {extensionButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.command && onExtensionButtonClick) {
                  onExtensionButtonClick(btn.command);
                } else if (btn.onClick) {
                  btn.onClick();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
              title={btn.tooltip || btn.label}
            >
              {btn.icon ? <span className="text-sm">{btn.icon}</span> : <Sparkles size={12} className="text-yellow-400" />}
              <span>{btn.label || btn.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* AI Input Bar */}
      <div className="bg-[#252525] border-b border-[#3c3c3c] px-3 py-2 flex items-center gap-2">
        <Sparkles className="text-purple-400" size={16} />
        <input
          id="ai-prompt-input"
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
          placeholder="Ask AI to modify code... (Ctrl+K)"
          disabled={isGenerating}
          className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
        />
        
        <button
          onClick={() => setShowAISettings(!showAISettings)}
          className="p-1 hover:bg-[#3c3c3c] rounded"
          title="AI Settings"
        >
          <Settings size={14} />
        </button>

        {isGenerating ? (
          <Loader2 className="animate-spin text-blue-400" size={16} />
        ) : (
          <button
            onClick={handleAIGenerate}
            disabled={!aiPrompt.trim()}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-xs flex items-center gap-1"
          >
            <Sparkles size={12} />
            Generate
          </button>
        )}
      </div>

      {/* AI Settings Dropdown */}
      {showAISettings && (
        <div className="absolute top-14 right-3 z-50 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg shadow-2xl p-3 w-80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">AI Settings</span>
            <button onClick={() => setShowAISettings(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Provider</label>
              <select
                value={aiSettings.provider}
                onChange={(e) => {
                  const newSettings = AISettingsManager.updateSetting('provider', e.target.value);
                  setAiSettings(newSettings);
                }}
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-xs mt-1"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400">API Key</label>
              <input
                type="password"
                value={aiSettings.apiKey}
                onChange={(e) => {
                  const newSettings = AISettingsManager.updateSetting('apiKey', e.target.value);
                  setAiSettings(newSettings);
                }}
                placeholder="Enter API key"
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-xs mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs text-gray-400">Auto-Apply Code</label>
              <input
                type="checkbox"
                checked={aiSettings.autoApply}
                onChange={(e) => {
                  const newSettings = AISettingsManager.updateSetting('autoApply', e.target.checked);
                  setAiSettings(newSettings);
                }}
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending Code Approval */}
      {pendingCode && (
        <div className="absolute bottom-4 right-4 bg-[#2d2d2d] border border-yellow-600 rounded-lg shadow-2xl p-3 z-50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" size={16} />
            <span className="text-sm font-medium">AI Generated Code</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Review the highlighted changes</p>
          <div className="flex gap-2">
            <button
              onClick={rejectCode}
              className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs flex items-center justify-center gap-1"
            >
              <X size={14} />
              Reject
            </button>
            <button
              onClick={() => applyCode(pendingCode)}
              className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs flex items-center justify-center gap-1"
            >
              <Check size={14} />
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height="100%"
        width="100%"
        language={getLanguage(file.name)}
        value={file.content}
        theme="vs-dark"
        path={file.path}
        onChange={(value) => onContentChange(file.id, value)}
        onMount={handleEditorDidMount}
        options={{
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          minimap: { enabled: settings.minimap },
          wordWrap: settings.wordWrap,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          glyphMargin: true
        }}
      />
    </div>
  );
}