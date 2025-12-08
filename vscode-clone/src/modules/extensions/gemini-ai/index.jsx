import React, { useState } from 'react';
import { Sparkles, Send, Zap } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const metadata = {
  id: 'devstudio.gemini',
  name: 'Gemini Assistant',
  version: '1.0.0',
  author: 'DevStudio'
};

export const settings = [
  { id: 'gemini.apiKey', label: 'Gemini API Key', type: 'password', category: 'AI' },
  { id: 'gemini.model', label: 'Model', type: 'text', default: 'gemini-1.5-flash', category: 'AI' }
];

// 🔥 EXTENSION UI COMPONENT
const GeminiPanel = ({ context }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('Hello! I am your Extension AI. How can I help?');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input) return;
    setLoading(true);
    
    const s = context.getSettings();
    const apiKey = s['gemini.apiKey'];
    if (!apiKey) {
        setResponse("⚠️ Please set API Key in Settings.");
        setLoading(false);
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: s['gemini.model'] || 'gemini-1.5-flash' });
        const result = await model.generateContent(input);
        const text = result.response.text();
        setResponse(text);
    } catch (e) {
        setResponse("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-white">
       <div className="p-3 border-b border-[#3c3c3c] font-bold text-xs bg-[#1e1e1e] flex items-center gap-2">
          <Sparkles size={14} className="text-yellow-400"/> GEMINI EXTENSION
       </div>
       
       <div className="flex-1 p-3 overflow-y-auto text-sm text-[#cccccc] whitespace-pre-wrap font-mono">
          {response}
       </div>

       <div className="p-2 border-t border-[#3c3c3c]">
          <div className="flex gap-2 bg-[#1e1e1e] p-1 rounded border border-[#3c3c3c]">
              <input 
                className="flex-1 bg-transparent outline-none text-xs px-2" 
                placeholder="Ask Extension..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
              />
              <button onClick={handleAsk} disabled={loading} className="p-1 hover:bg-[#333] rounded">
                 {loading ? <Zap size={14} className="animate-pulse"/> : <Send size={14}/>}
              </button>
          </div>
       </div>
    </div>
  );
};

// 🔥 ACTIVATE FUNCTION
export const activate = (context) => {
  // Register Sidebar Panel
  context.registerSidebarPanel(
    'gemini-panel-view', // Unique ID
    {
      icon: 'sparkles', // Icon Name
      label: 'Gemini AI',
    },
    // Pass Component
    (props) => <GeminiPanel context={context} {...props} /> 
  );

  // Commands can still exist
  context.registerCommand('gemini.hello', () => {
     context.toast.success("Hello from Extension!");
  });
};