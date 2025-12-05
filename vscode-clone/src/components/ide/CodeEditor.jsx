import React, { useRef, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

export default function CodeEditor({ file, onContentChange, settings, onValidate, focusLine }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

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
      colors: { 'editor.background': '#1e1e1e', 'editor.lineHighlightBackground': '#2a2d2e' }
    });
    monaco.editor.setTheme('devstudio-dark');

    monaco.editor.onDidChangeMarkers(() => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const formattedProblems = markers.map(m => ({
          file: file.name,
          message: m.message, line: m.startLineNumber,
          severity: m.severity === 8 ? 'Error' : 'Warning', source: m.source || 'TS/JS'
        }));
        if(onValidate) onValidate(formattedProblems);
      }
    });
  };

  // 🔥 Apply Settings Dynamically
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

  // Focus Line Logic
  useEffect(() => {
    if (editorRef.current && focusLine) {
      editorRef.current.revealLineInCenter(focusLine);
      editorRef.current.setPosition({ lineNumber: focusLine, column: 1 });
      editorRef.current.focus();
    }
  }, [focusLine, file?.id]);

  if (!file) return <div className="flex-1 bg-[#1e1e1e]" />;

  return (
    <div className="flex-1 h-full overflow-hidden bg-[#1e1e1e]">
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
          fontSize: settings.fontSize, // Init with settings
          fontFamily: settings.fontFamily,
          minimap: { enabled: settings.minimap },
          wordWrap: settings.wordWrap,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
        }}
      />
    </div>
  );
}