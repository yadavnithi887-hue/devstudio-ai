// src/components/ide/AIChatPanel.jsx
// 🤖 AI Chat Panel - RIGHT SIDEBAR with Smart Execution

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Settings, X, Check, RotateCcw,
  Loader2, ChevronLeft, ChevronRight, Terminal, FileCode,
  CheckCircle, AlertCircle, Info, Maximize2, Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  AICodeGenerator, 
  AISettingsManager, 
  ProjectContextBuilder
} from '../../lib/aiCodingService';
import { AIExecutor, generateSmartSystemPrompt } from '../../lib/aiExecutor';

export default function AIChatPanel({ 
  files = [],
  activeFile,
  onFileCreate,
  onFileUpdate,
  onCommandExecute,
  onFileOpen,
  getCurrentTerminalPath, // Function to get current terminal path
  projectRoot // Current project root directory
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(AISettingsManager.getSettings());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const generatorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;
    
    if (!settings.apiKey) {
      alert('⚠️ Please add your API key in settings first!');
      setShowSettings(true);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Get current terminal path dynamically
    const terminalPath = getCurrentTerminalPath ? getCurrentTerminalPath() : null;
    
    // Build context
    const context = ProjectContextBuilder.buildContext(files, activeFile);
    
    // Generate smart system prompt
    const smartPrompt = generateSmartSystemPrompt({
      terminalPath: terminalPath,
      projectRoot: projectRoot,
      files: files,
      frameworks: context.frameworks || [],
      activeFile: activeFile
    });

    // Create AI generator
    const generator = new AICodeGenerator(
      settings.provider, 
      settings.apiKey, 
      settings.model
    );
    generatorRef.current = generator;

    let fullResponse = '';
    const aiMessage = { 
      role: 'assistant', 
      content: '', 
      streaming: true, 
      progress: [] 
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // Generate AI response with streaming
      await generator.generateCode(
        input,
        { ...context, systemPrompt: smartPrompt },
        
        // onChunk - real-time streaming
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: fullResponse,
              streaming: true
            };
            return newMessages;
          });
        },
        
        // onComplete - execute operations
        async (finalText) => {
          console.log('🤖 AI Response Complete:', finalText);
          
          // Create executor
          const executor = new AIExecutor({
            getCurrentTerminalPath: getCurrentTerminalPath,
            
            executeCommand: async (cmd) => {
              console.log('⚡ Executing command:', cmd);
              if (onCommandExecute) {
                const result = await onCommandExecute(cmd);
                return result || { success: false, error: 'No result' };
              }
              return { success: false, error: 'Command execution not available' };
            },
            
            createFile: async (path, content) => {
              console.log('📝 Creating file:', path);
              if (onFileCreate) {
                const result = await onFileCreate(path, content);
                return result || { success: false, error: 'No result' };
              }
              return { success: false, error: 'File creation not available' };
            },
            
            updateFile: async (path, content) => {
              console.log('📝 Updating file:', path);
              if (onFileUpdate) {
                const result = await onFileUpdate(path, content);
                return result || { success: false, error: 'No result' };
              }
              return { success: false, error: 'File update not available' };
            },
            
            openFile: (file) => {
              console.log('📂 Opening file:', file);
              if (onFileOpen) {
                onFileOpen(file);
              }
            },
            
            onProgress: (progress) => {
              console.log('📊 Progress:', progress);
              
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                lastMsg.progress = [...(lastMsg.progress || []), progress];
                return newMessages;
              });
            },
            
            onError: (error) => {
              console.error('❌ Execution error:', error);
            }
          });

          // Execute all operations
          const result = await executor.execute(finalText);
          console.log('✅ Execution result:', result);

          // Finalize message
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              streaming: false,
              executionComplete: true,
              isExplanation: result.isExplanation
            };
            return newMessages;
          });

          setIsGenerating(false);
        }
      );
      
    } catch (error) {
      console.error('AI Error:', error);
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `❌ Error: ${error.message}`,
          streaming: false,
          error: true
        };
        return newMessages;
      });
      
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    if (generatorRef.current) {
      generatorRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = AISettingsManager.updateSetting(key, value);
    setSettings(newSettings);
  };

  // Get progress icon
  const getProgressIcon = (type) => {
    switch (type) {
      case 'command': return <Terminal size={14} className="text-blue-400" />;
      case 'file': return <FileCode size={14} className="text-purple-400" />;
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'executing': return <Loader2 size={14} className="text-yellow-400 animate-spin" />;
      default: return <Info size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className={`bg-[#1e1e1e] border-l border-[#3c3c3c] flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-12' : isMaximized ? 'w-full' : 'w-96'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c] bg-[#252525]">
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <span className="text-sm font-medium text-white">AI Assistant</span>
              {isGenerating && <Loader2 className="animate-spin text-blue-400" size={14} />}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 hover:bg-[#2d2d2d] rounded"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-[#2d2d2d] rounded"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setMessages([])}
                className="p-1 hover:bg-[#2d2d2d] rounded"
                title="Clear Chat"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-[#2d2d2d] rounded"
                title="Collapse"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
        
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center py-2 hover:bg-[#2d2d2d] rounded"
            title="Expand AI Panel"
          >
            <ChevronLeft size={20} className="text-purple-400" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 border-b border-[#3c3c3c] bg-[#252525] space-y-3 max-h-64 overflow-y-auto">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Provider</label>
                <select
                  value={settings.provider}
                  onChange={(e) => handleSettingChange('provider', e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-sm text-white"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-sm text-white"
                >
                  {settings.provider === 'openrouter' && (
                    <>
                      <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (FREE)</option>
                      <option value="nousresearch/hermes-3-llama-3.1-405b:free">Hermes 3 405B (FREE)</option>
                      <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (FREE)</option>
                    </>
                  )}
                  {settings.provider === 'openai' && (
                    <>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">API Key</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                  placeholder="Enter API key"
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-sm text-white"
                />
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                <Sparkles className="mx-auto mb-2 text-purple-400" size={32} />
                <p className="mb-1 font-medium">AI Assistant Ready</p>
                <p className="text-xs">Ask me to build anything!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : msg.error
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-[#2d2d2d] text-gray-200'
                }`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="prose prose-invert prose-sm max-w-none text-xs">
                        <ReactMarkdown
                          components={{
                            code: ({ node, inline, ...props }) => 
                              inline ? (
                                <code className="bg-[#1e1e1e] px-1 rounded" {...props} />
                              ) : (
                                <code className="block bg-[#1e1e1e] p-2 rounded text-xs overflow-x-auto" {...props} />
                              )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Progress Indicators */}
                      {msg.progress && msg.progress.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-gray-600 pt-2">
                          {msg.progress.map((prog, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              {getProgressIcon(prog.type)}
                              <span className="flex-1 leading-tight">{prog.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.streaming && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <Loader2 className="animate-spin" size={12} />
                          <span>Generating...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#3c3c3c]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask AI to build anything..."
                disabled={isGenerating}
                className="flex-1 bg-[#2d2d2d] border border-[#3c3c3c] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              
              {isGenerating ? (
                <button
                  onClick={handleStopGeneration}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center gap-2"
                  title="Stop"
                >
                  <X size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2"
                  title="Send"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}