import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Copy, Check, Code, FileCode, Loader2, Zap, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateAIResponse } from '@/lib/aiService';
import ReactMarkdown from 'react-markdown';

export default function AIChat({ isOpen, onClose, activeFile, onApplyCode, files }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI coding assistant. I can help you write, debug, and improve your code. What would you like to work on?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [commandOutput, setCommandOutput] = useState(null); // New state for command output
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Check if the message is a command to execute
    if (userMessage.startsWith('/exec ')) {
      const command = userMessage.substring(6); // Remove '/exec '
      try {
        const result = await window.electronAPI.execCommand(command);
        let outputContent = `**Command:** \`${command}\`\n\n`;
        if (result.stdout) outputContent += `**Stdout:**\n\`\`\`\n${result.stdout}\n\`\`\`\n`;
        if (result.stderr) outputContent += `**Stderr:**\n\`\`\`\n${result.stderr}\n\`\`\`\n`;
        if (result.error) outputContent += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n`;
        
        setMessages(prev => [...prev, { role: 'assistant', content: outputContent }]);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ **Execution Error:** ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
      return; // Exit after handling command
    }

    try {
      const settings = JSON.parse(localStorage.getItem('devstudio-settings') || '{}');
      const apiKey = settings.apiKey;
      const provider = settings.aiProvider || 'gemini';

      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚠️ **API Key Missing!**\n\nPlease go to **Settings** (Click the Gear icon ⚙️) and enter your API Key for Google Gemini, OpenAI, or OpenRouter to start chatting."
        }]);
        setIsLoading(false);
        return;
      }

      const response = await generateAIResponse(provider, apiKey, newMessages, activeFile);

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error:** ${error.message}\n\nPlease check your API Key in settings.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const extractCodeBlocks = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({ language: match[1] || 'text', code: match[2].trim() });
    }
    return blocks;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="w-96 bg-[#1e1e1e] border-l border-[#3c3c3c] flex flex-col h-full">
      {/* Header */}
      <div className="h-10 bg-[#252526] flex items-center justify-between px-3 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#007acc]" />
          <span className="text-sm text-white font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white"
            title="New Chat"
          >
            <Plus size={14} />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Context Bar */}
      {activeFile && (
        <div className="px-3 py-2 bg-[#252526] border-b border-[#3c3c3c] flex items-center gap-2">
          <FileCode size={14} className="text-[#858585]" />
          <span className="text-xs text-[#858585]">Context:</span>
          <span className="text-xs text-[#007acc]">{activeFile.name}</span>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-3", msg.role === 'user' && "flex-row-reverse")}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'assistant' ? "bg-[#007acc]" : "bg-[#6e6e6e]"
            )}>
              {msg.role === 'assistant' ? <Sparkles size={14} className="text-white" /> : <User size={14} className="text-white" />}
            </div>
            <div className={cn(
              "flex-1 rounded-lg p-3 text-sm",
              msg.role === 'assistant' ? "bg-[#252526]" : "bg-[#094771]"
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeContent = String(children).replace(/\n$/, '');
                        
                        if (!inline && match) {
                          return (
                            <div className="relative group my-2">
                              <div className="flex items-center justify-between bg-[#3c3c3c] px-3 py-1 rounded-t text-xs text-[#858585]">
                                <span>{match[1]}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => copyToClipboard(codeContent, idx)}
                                    className="p-1 hover:bg-[#4c4c4c] rounded"
                                  >
                                    {copiedIndex === idx ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                  </button>
                                  {activeFile && (
                                    <button
                                      onClick={() => onApplyCode(codeContent)}
                                      className="p-1 hover:bg-[#4c4c4c] rounded text-[#007acc]"
                                      title="Apply to current file"
                                    >
                                      <Zap size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <pre className="bg-[#1e1e1e] p-3 rounded-b overflow-x-auto">
                                <code className="text-[#d4d4d4] text-xs">{codeContent}</code>
                              </pre>
                            </div>
                          );
                        }
                        return <code className="bg-[#3c3c3c] px-1 py-0.5 rounded text-[#ce9178]" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="text-[#cccccc] mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-[#cccccc] mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside text-[#cccccc] mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-white whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#007acc] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-[#252526] rounded-lg p-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#007acc]" />
              <span className="text-sm text-[#858585]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Actions */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto">
        {['Explain code', 'Find bugs', 'Optimize', 'Add comments', '/exec '].map((action) => (
          <button
            key={action}
            onClick={() => setInput(action)}
            className="px-2 py-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] rounded text-xs text-[#cccccc] whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-[#3c3c3c]">
        <div className="flex items-end gap-2 bg-[#3c3c3c] rounded-lg p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm outline-none resize-none max-h-32 placeholder:text-[#6e6e6e]"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-1.5 rounded transition-colors",
              input.trim() ? "bg-[#007acc] text-white hover:bg-[#006bb3]" : "text-[#6e6e6e]"
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-xs text-[#6e6e6e] text-center">
          Ctrl+I to toggle • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}