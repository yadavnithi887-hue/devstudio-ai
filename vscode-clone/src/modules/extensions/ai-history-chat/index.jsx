// File: src/modules/extensions/ai-history-chat/index.jsx

import React, { useState } from 'react';
import { Bot, User, Send, MessageSquare } from 'lucide-react';

export const metadata = {
  id: 'devstudio.ai-history-chat',
  name: 'AI History Chat',
  version: '1.0.0',
  description: 'A contextual chat with history support. Ask questions and get AI responses with conversation context.',
  author: 'DevStudio Team',
  icon: 'MessageSquare', // 🔥 Icon naam
  readme: `
# AI History Chat Extension

## Features
- 💬 Conversational AI with context awareness
- 📝 Full conversation history
- 🤖 Smart responses based on previous messages
- ⚡ Fast and responsive

## Usage
1. Open the AI Chat panel from the activity bar
2. Type your question in the input box
3. Press Enter or click Send
4. The AI will respond with context from previous messages

## Settings
Configure your AI provider in Settings > Extensions
  `
};

// 🔥 Settings for this extension
export const settings = [
  {
    id: 'aiHistoryChat.provider',
    label: 'AI Provider',
    type: 'select',
    options: ['gemini', 'openai', 'local'],
    default: 'gemini',
    description: 'Select the AI service provider for chat',
    section: 'extensions',
    extensionId: metadata.id
  },
  {
    id: 'aiHistoryChat.maxHistory',
    label: 'Max History Length',
    type: 'number',
    default: 50,
    description: 'Maximum number of messages to keep in history',
    section: 'extensions',
    extensionId: metadata.id
  }
];

// UI Component
const AIChatPanel = ({ context }) => {
  const [messages, setMessages] = useState([
    { role: 'model', parts: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    const userMsg = { role: 'user', parts: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');

    try {
      // Execute command
      const reply = await context.executeCommand('ai.chat', {
        history: newHistory,
        prompt: input
      });
      
      if (reply) {
        setMessages(prev => [...prev, { role: 'model', parts: reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: '❌ Error: Failed to get response' 
      }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
      <div className="p-3 text-xs font-bold border-b border-[#3c3c3c] bg-[#252526] flex items-center gap-2">
        <MessageSquare size={14} className="text-blue-400" />
        AI HISTORY CHAT
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'model' && (
              <div className="flex-shrink-0">
                <Bot size={16} className="text-blue-400" />
              </div>
            )}
            <div 
              className={`p-2 rounded-lg text-xs max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-[#007acc] text-white' 
                  : 'bg-[#2d2d30] text-[#cccccc]'
              }`}
            >
              {msg.parts}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0">
                <User size={16} className="text-green-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot size={16} className="text-blue-400 animate-pulse" />
            <div className="p-2 rounded-lg text-xs bg-[#2d2d30] text-[#cccccc]">
              Thinking...
            </div>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-[#3c3c3c]">
        <div className="flex gap-2 bg-[#252526] p-2 rounded border border-[#3c3c3c]">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} 
            className="flex-1 bg-transparent text-white text-xs outline-none" 
            placeholder="Ask me anything..."
            disabled={loading}
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="p-1 hover:bg-[#333] rounded disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const activate = (context) => {
  // 1. Register Sidebar Panel
  context.registerSidebarPanel(
    'ai-history-panel',
    { 
      icon: 'sparkles', // 🔥 Correct icon name for ActivityBar
      label: 'AI Chat' 
    },
    (props) => <AIChatPanel context={context} {...props} />
  );

  // 2. Register Command (API Call)
  context.registerCommand('ai.chat', async ({ history, prompt }) => {
    // Simulated AI response - replace with real API
    const responses = [
      "That's an interesting question! Let me help you with that.",
      "Based on what you've asked, here's my understanding...",
      "I can help you with that. Here's what I think...",
      "Great question! Let me provide some insights.",
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} You said: "${prompt}"`;
  });

  console.log("💬 AI History Chat Extension Activated!");
};

export const deactivate = () => {
  console.log("💬 AI History Chat Extension Deactivated");
};
