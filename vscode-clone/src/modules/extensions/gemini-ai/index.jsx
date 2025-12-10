// File: src/modules/extensions/gemini-ai/index.jsx

import React, { useState } from 'react';
import { Sparkles, Send, Zap } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const metadata = {
  id: 'devstudio.gemini',
  name: 'Gemini AI Assistant',
  version: '1.2.0',
  description: 'Google Gemini AI integration for code assistance, explanations, and more.',
  author: 'DevStudio Team',
  icon: 'Sparkles',
  readme: `
# Gemini AI Extension

## Features
- 🤖 Direct integration with Google Gemini AI
- 💡 Code explanations and suggestions
- 🔧 Custom AI model selection
- ⚡ Fast responses with streaming support

## Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Go to Settings > Extensions > Gemini AI
3. Enter your API key
4. Select your preferred model

## Usage
Click the Gemini icon in the activity bar to open the AI assistant panel.
  `
};

export const settings = [
  { 
    id: 'gemini.apiKey', 
    label: 'Gemini API Key', 
    type: 'password',
    description: 'Your Google Gemini API key',
    section: 'extensions',
    extensionId: metadata.id
  },
  { 
    id: 'gemini.model', 
    label: 'Model', 
    type: 'select',
    options: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
    default: 'gemini-1.5-flash',
    description: 'Select the Gemini model to use',
    section: 'extensions',
    extensionId: metadata.id
  }
];

const GeminiPanel = ({ context }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('Hello! I am your Gemini AI assistant. How can I help you today?');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    const s = context.getSettings();
    const apiKey = s['gemini.apiKey'];
    
    if (!apiKey) {
      setResponse("⚠️ Please set your Gemini API Key in Settings > Extensions.");
      setLoading(false);
      return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: s['gemini.model'] || 'gemini-1.5-flash' 
      });
      const result = await model.generateContent(input);
      const text = result.response.text();
      setResponse(text);
      setInput('');
    } catch (e) {
      setResponse("❌ Error: " + e.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-white">
      <div className="p-3 border-b border-[#3c3c3c] font-bold text-xs bg-[#1e1e1e] flex items-center gap-2">
        <Sparkles size={14} className="text-yellow-400" /> 
        GEMINI AI
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto text-sm text-[#cccccc] whitespace-pre-wrap">
        {loading ? (
          <div className="flex items-center gap-2">
            <Zap size={16} className="animate-pulse text-yellow-400" />
            <span className="text-xs">Thinking...</span>
          </div>
        ) : (
          response
        )}
      </div>
      
      <div className="p-2 border-t border-[#3c3c3c]">
        <div className="flex gap-2 bg-[#1e1e1e] p-2 rounded border border-[#3c3c3c]">
          <input
            className="flex-1 bg-transparent outline-none text-xs px-2 text-white"
            placeholder="Ask Gemini AI..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            disabled={loading}
          />
          <button 
            onClick={handleAsk} 
            disabled={loading || !input.trim()} 
            className="p-1 hover:bg-[#333] rounded disabled:opacity-30"
          >
            {loading ? <Zap size={14} className="animate-pulse" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const activate = (context) => {
  context.registerSidebarPanel(
    'gemini-panel-view',
    {
      icon: 'sparkles',
      label: 'Gemini AI',
    },
    (props) => <GeminiPanel context={context} {...props} />
  );

  context.registerCommand('gemini.hello', () => {
    context.toast.success("Hello from Gemini Extension!");
  });

  console.log("✨ Gemini AI Extension Activated!");
};

export const deactivate = () => {
  console.log("✨ Gemini AI Extension Deactivated");
};