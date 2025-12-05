import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import 'xterm/css/xterm.css';
import { ChevronUp, X, Minus, Plus, Trash2, Monitor, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Problems Tab ---
const ProblemsTab = ({ problems, onNavigate }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const handleCopy = (prob, index) => {
    const fullLog = `[${prob.severity}] ${prob.file}:${prob.line} - ${prob.message}`;
    navigator.clipboard.writeText(fullLog);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  if (problems.length === 0) return <div className="p-4 text-[#cccccc] text-sm">No problems detected.</div>;
  return (
    <div className="h-full overflow-y-auto p-2">
      {problems.map((prob, i) => (
        <div key={i} onClick={() => onNavigate && onNavigate(prob.file, prob.line)} onContextMenu={(e) => { e.preventDefault(); handleCopy(prob, i); }} className="flex items-start gap-2 mb-2 p-1 hover:bg-[#2a2d2e] cursor-pointer text-sm group relative">
          {prob.severity === 'Error' ? <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" /> : <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <span className="text-[#cccccc] truncate block">{prob.message}</span>
            <div className="text-[#858585] text-xs font-mono">{prob.file}({prob.line},1)</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Single Terminal Instance ---
const TerminalInstance = ({ id, active, onData }) => {
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const termInstance = useRef(null);

  // Helper: Safe Fit Function
  const safeFit = () => {
    if (!fitAddonRef.current || !termInstance.current) return;
    
    // 🔥 CRITICAL FIX: Check if element is visible in DOM
    // offsetParent null tab hota hai jab element 'display: none' ho
    if (terminalRef.current && terminalRef.current.offsetParent !== null) {
      try {
        fitAddonRef.current.fit();
        // Backend sync
        if (window.electronAPI && termInstance.current.cols) {
           window.electronAPI.resizeTerminal(id, { 
             cols: termInstance.current.cols, 
             rows: termInstance.current.rows 
           });
        }
      } catch (e) {
        // Silent catch (Dimensions error yahan suppress ho jayega)
      }
    }
  };

  useEffect(() => {
    if (!window.electronAPI) return;

    const term = new XTerminal({
      theme: { background: '#1e1e1e', foreground: '#cccccc', cursor: '#ffffff', selection: '#264f78', black: '#000000', red: '#f14c4c', green: '#23d18b', yellow: '#f5f543', blue: '#3b8eea', magenta: '#d670d6', cyan: '#29b8db', white: '#e5e5e5' },
      fontFamily: "Cascadia Code, Consolas, monospace", fontSize: 14, cursorBlink: true, convertEol: true, allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    
    term.open(terminalRef.current);
    fitAddonRef.current = fitAddon;
    termInstance.current = term;

    // Initial Fit with Delay
    requestAnimationFrame(() => setTimeout(safeFit, 100));

    // Data Listeners
    const disposable = term.onData(data => window.electronAPI.writeTerminal(id, data));
    
    // Resize Observer with Safe Fit
    const ro = new ResizeObserver(() => {
       window.requestAnimationFrame(safeFit);
    });
    if (terminalRef.current) ro.observe(terminalRef.current);
    
    onData(id, term);

    // Key Handlers
    term.attachCustomKeyEventHandler((e) => {
        if (e.ctrlKey && e.code === "KeyV" && e.type === "keydown") { navigator.clipboard.readText().then(t => window.electronAPI.writeTerminal(id, t)); return false; }
        if (e.ctrlKey && e.code === "KeyC" && term.hasSelection()) return false;
        return true;
    });
    
    const handleRightClick = async (e) => { e.preventDefault(); const t = await navigator.clipboard.readText(); if(t) window.electronAPI.writeTerminal(id, t); };
    terminalRef.current.addEventListener('contextmenu', handleRightClick);

    return () => { 
      disposable.dispose(); 
      ro.disconnect(); 
      term.dispose(); 
      if(terminalRef.current) terminalRef.current.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);

  // Re-fit when tab becomes active
  useEffect(() => {
    if (active) {
       // Thoda wait karo taki display:none se display:block ho jaye
       setTimeout(safeFit, 100);
    }
  }, [active]);

  return <div className={cn("w-full h-full p-1 pl-3", active ? "block" : "hidden")} ref={terminalRef} />;
};

// --- Main Terminal Component ---
export default function Terminal({ isOpen, onToggle, onMaximize, isMaximized, problems = [], outputLogs = [], onNavigateProblem }) {
  const [activeTab, setActiveTab] = useState('terminal');
  const [terminals, setTerminals] = useState([]);
  const [activeTermId, setActiveTermId] = useState(null);
  const termRefs = useRef({});

  useEffect(() => {
    if (isOpen && terminals.length === 0) addTerminal();
  }, [isOpen]);

  useEffect(() => {
    if (!window.electronAPI) return;
    const removeListener = window.electronAPI.onTerminalData((id, data) => {
      if (termRefs.current[id]) termRefs.current[id].write(data);
    });
    return () => removeListener();
  }, []);

  const addTerminal = async () => {
    if (!window.electronAPI) return;
    try {
      const newId = await window.electronAPI.createTerminal(localStorage.getItem('devstudio-last-project'));
      setTerminals(p => [...p, { id: newId, name: 'PowerShell' }]);
      setActiveTermId(newId);
    } catch (e) {}
  };

  const removeTerminal = (id, e) => {
    e.stopPropagation();
    if (!window.electronAPI) return;
    window.electronAPI.killTerminal(id);
    setTerminals(p => {
      const n = p.filter(t => t.id !== id);
      if (id === activeTermId && n.length > 0) setActiveTermId(n[n.length - 1].id);
      return n;
    });
    delete termRefs.current[id];
  };

  if (!isOpen) return null;

  return (
    <div className={cn("bg-[#1e1e1e] flex flex-col border-t border-[#3c3c3c] transition-all duration-200", isMaximized ? "absolute inset-0 z-50 h-full" : "h-52")}>
      
      {/* Header */}
      <div className="h-9 bg-[#252526] flex items-center justify-between px-2 border-b border-[#3c3c3c] flex-shrink-0">
        <div className="flex gap-6 text-[11px] uppercase tracking-wide font-medium pl-2">
          {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL'].map(tab => {
             const key = tab.split(' ')[0].toLowerCase();
             return (
               <button 
                 key={key} 
                 onClick={() => setActiveTab(key)} 
                 className={cn("pb-1 border-b-2 transition-colors flex items-center gap-1", activeTab === key ? "text-white border-[#e7e7e7]" : "text-[#858585] border-transparent hover:text-[#cccccc]")}
               >
                 {key === 'problems' && problems.length > 0 && <span className="bg-[#f14c4c] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{problems.length}</span>}
                 {tab}
               </button>
             );
          })}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onMaximize} className="text-[#cccccc] hover:bg-[#3c3c3c] p-1 rounded">
             {isMaximized ? <ChevronUp className="rotate-180" size={14}/> : <ChevronUp size={14}/>}
           </button>
           <button onClick={onToggle} className="text-[#cccccc] hover:bg-[#3c3c3c] p-1 rounded"><X size={14}/></button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
        {activeTab === 'problems' && <ProblemsTab problems={problems} onNavigate={onNavigateProblem} />}
        {activeTab === 'output' && <div className="p-4 text-[#cccccc] text-xs font-mono">Output logs will appear here.</div>}
        {activeTab === 'debug' && <div className="p-4 text-[#cccccc] text-xs font-mono">Debug console ready.</div>}
        
        <div className={cn("flex-1 flex overflow-hidden", activeTab === 'terminal' ? "flex" : "hidden")}>
           <div className="flex-1 overflow-hidden relative">
              {terminals.length === 0 ? <div className="flex items-center justify-center h-full text-[#555]">No open terminals</div> : 
                terminals.map(t => <TerminalInstance key={t.id} id={t.id} active={t.id === activeTermId} onData={(id, i) => termRefs.current[id] = i} />)
              }
           </div>
           <div className="w-36 bg-[#252526] border-l border-[#3c3c3c] flex flex-col">
              <div className="flex items-center justify-between p-2 text-[10px] text-[#cccccc] font-medium bg-[#2d2d2d]">
                 <span>POWERSHELL</span>
                 <button onClick={addTerminal} className="hover:bg-[#3c3c3c] p-1 rounded"><Plus size={12}/></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                 {terminals.map(t => (
                   <div key={t.id} onClick={() => setActiveTermId(t.id)} className={cn("flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs group", activeTermId === t.id ? "bg-[#37373d] text-white" : "text-[#858585] hover:text-[#cccccc]")}>
                      <div className="flex items-center gap-2 overflow-hidden"><Monitor size={12} /><span className="truncate">powershell</span></div>
                      <button onClick={(e) => removeTerminal(t.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={12}/></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}