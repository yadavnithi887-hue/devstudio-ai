import React, { useRef, useEffect, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Sparkles } from 'lucide-react';

loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
});

export default function CodeEditor({
  file,
  onContentChange,
  settings,
  onValidate,
  focusLine,

  extensionButtons = [],        // ✅ FROM LAYOUT
  onExtensionButtonClick       // ✅ FROM LAYOUT
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [extButtons, setExtButtons] = useState([]);

  // ✅ LANGUAGE DETECTOR
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

  // ✅ MONACO MOUNT
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

  // ✅ APPLY SETTINGS
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

  // ✅ FOCUS LINE
  useEffect(() => {
    if (editorRef.current && focusLine) {
      editorRef.current.revealLineInCenter(focusLine);
      editorRef.current.setPosition({ lineNumber: focusLine, column: 1 });
      editorRef.current.focus();
    }
  }, [focusLine, file?.id]);

  // ✅ UPDATE BUTTONS FROM LAYOUT
  useEffect(() => {
    if (extensionButtons) {
      setExtButtons(extensionButtons);
    }
  }, [extensionButtons]);

  // ✅ FINAL CLICK HANDLER (YOUR REQUIRED VERSION)
  const handleExtButtonClick = (command) => {
    if (onExtensionButtonClick) {
      onExtensionButtonClick(command);
    }
  };

  if (!file) return <div className="flex-1 bg-[#1e1e1e]" />;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#1e1e1e] relative">

      {/* ✅ ✅ ✅ EXTENSION BUTTONS TOOLBAR (MONACO KE UPAR) */}
      {extButtons && extButtons.length > 0 && (
        <div className="bg-[#2d2d2d] border-b border-[#3c3c3c] px-3 py-1 flex items-center gap-2">
          {extButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                console.log('🖱️ Editor button clicked:', btn);

                if (btn.command && onExtensionButtonClick) {
                  onExtensionButtonClick(btn.command);
                } else if (btn.onClick) {
                  try {
                    btn.onClick();
                  } catch (e) {
                    console.error('Error executing button onClick:', e);
                  }
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
              title={btn.tooltip || btn.label}
            >
              {btn.icon ? (
                <span className="text-sm">{btn.icon}</span>
              ) : (
                <Sparkles size={12} className="text-yellow-400" />
              )}

              <span>{btn.label || btn.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* ✅ ✅ ✅ MONACO EDITOR */}
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
          smoothScrolling: true
        }}
      />
    </div>
  );
}
