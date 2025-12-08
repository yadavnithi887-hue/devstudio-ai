import React, { useState } from 'react';
import { Bot, User, Send } from 'lucide-react';

export const metadata = {
  id: 'devstudio.ai-history-chat',
  name: 'AI History Chat',
  description: 'A contextual chat with history support.'
};

// UI Component
const AIChatPanel = ({ context }) => {
  const [messages, setMessages] = useState([{ role: 'model', parts: 'How can I help?' }]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input) return;

    const newHistory = [...messages, { role: 'user', parts: input }];
    setMessages(newHistory);
    setInput('');
    
    // Command chalao
    const reply = await context.executeCommand('ai.chat', {
        history: newHistory,
        prompt: input
    });
    
    if(reply) setMessages(prev => [...prev, { role: 'model', parts: reply }]);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
       <div className="p-2 text-xs font-bold border-b border-[#3c3c3c]">AI CONVERSATION</div>
       <div className="flex-1 p-2 overflow-y-auto">
          {messages.map((msg, i) => (
             <div key={i} className={`flex gap-2 mb-2 ${msg.role === 'user' && 'justify-end'}`}>
                {msg.role === 'model' && <Bot size={14}/>}
                <div className={`p-2 rounded text-xs ${msg.role==='user'?'bg-blue-800':'bg-gray-700'}`}>{msg.parts}</div>
             </div>
          ))}
       </div>
       <div className="p-2 border-t border-[#3c3c3c]">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} className="w-full bg-[#252526] text-white p-1 text-xs outline-none" placeholder="Type here..."/>
       </div>
    </div>
  );
};

export const activate = (context) => {
  // 1. Sidebar Panel
  context.registerSidebarPanel(
    'ai-history-panel',
    { icon: 'bot', label: 'AI History Chat' },
    (props) => <AIChatPanel context={context} {...props} /> 
  );

  // 2. Command (API Call)
  context.registerCommand('ai.chat', async ({ history, prompt }) => {
     // Yahan real Gemini API call hoga
     // Abhi ke liye hum dummy reply denge
     return `You said: "${prompt}". I am a history-aware bot.`;
  });

  console.log("💬 AI History Chat Active!");
};