import React, { useState } from 'react';
import { Play, Pause, SkipForward, ArrowDownToLine, ArrowUpFromLine, RotateCcw, Square, ChevronDown, ChevronRight, Circle, Bug, Hash, Layers, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function DebugPanel({ onShowComingSoon }) {
  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpointsExpanded, setBreakpointsExpanded] = useState(true);
  const [variablesExpanded, setVariablesExpanded] = useState(true);
  const [callStackExpanded, setCallStackExpanded] = useState(true);
  
  const breakpoints = [
    { file: 'app.js', line: 15, enabled: true },
    { file: 'utils.js', line: 8, enabled: true },
    { file: 'index.js', line: 23, enabled: false },
  ];
  
  const variables = [
    { name: 'count', value: '0', type: 'number' },
    { name: 'items', value: 'Array(3)', type: 'array' },
    { name: 'user', value: '{...}', type: 'object' },
    { name: 'isLoading', value: 'false', type: 'boolean' },
  ];
  
  const callStack = [
    { name: 'handleClick', file: 'app.js', line: 15 },
    { name: 'onClick', file: 'Button.jsx', line: 42 },
    { name: 'anonymous', file: 'react-dom.js', line: 1024 },
  ];

  return (
    <div className="h-full bg-[#252526] flex flex-col">
      <div className="p-3 border-b border-[#3c3c3c]">
        <div className="text-xs uppercase tracking-wider text-[#bbbbbb] mb-3">Run and Debug</div>
        
        {/* Debug Controls */}
        <div className="flex items-center gap-1 mb-3 p-1 bg-[#3c3c3c] rounded">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (isDebugging) {
                setIsDebugging(false);
              } else {
                onShowComingSoon?.('Debugger');
              }
            }}
            className={cn(
              "h-7 w-7 p-0",
              isDebugging ? "text-yellow-500" : "text-green-500 hover:text-green-400"
            )}
            title={isDebugging ? "Pause" : "Start Debugging"}
          >
            {isDebugging ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowComingSoon?.('Stop Debugging')}
            disabled={!isDebugging}
            className="h-7 w-7 p-0 text-red-500 disabled:opacity-30"
            title="Stop"
          >
            <Square size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowComingSoon?.('Restart Debugging')}
            disabled={!isDebugging}
            className="h-7 w-7 p-0 text-green-500 disabled:opacity-30"
            title="Restart"
          >
            <RotateCcw size={14} />
          </Button>
          <div className="w-px h-5 bg-[#555] mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowComingSoon?.('Step Over')}
            disabled={!isDebugging}
            className="h-7 w-7 p-0 text-[#858585] disabled:opacity-30"
            title="Step Over (F10)"
          >
            <SkipForward size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowComingSoon?.('Step Into')}
            disabled={!isDebugging}
            className="h-7 w-7 p-0 text-[#858585] disabled:opacity-30"
            title="Step Into (F11)"
          >
            <ArrowDownToLine size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowComingSoon?.('Step Out')}
            disabled={!isDebugging}
            className="h-7 w-7 p-0 text-[#858585] disabled:opacity-30"
            title="Step Out (Shift+F11)"
          >
            <ArrowUpFromLine size={14} />
          </Button>
        </div>
        
        {/* Configuration Dropdown */}
        <div 
          onClick={() => onShowComingSoon?.('Debug Configuration')}
          className="flex items-center gap-2 px-2 py-1.5 bg-[#3c3c3c] rounded cursor-pointer hover:bg-[#454545]"
        >
          <Bug size={14} className="text-[#007acc]" />
          <span className="text-sm text-white flex-1">Launch Chrome</span>
          <ChevronDown size={14} className="text-[#858585]" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        <div className="border-b border-[#3c3c3c]">
          <div 
            onClick={() => setVariablesExpanded(!variablesExpanded)}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] text-xs text-[#cccccc]"
          >
            {variablesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Hash size={14} className="text-[#858585]" />
            <span className="font-medium">Variables</span>
          </div>
          
          {variablesExpanded && (
            <div className="pb-2">
              {variables.map((v, i) => (
                <div key={i} className="flex items-center gap-2 px-7 py-1 hover:bg-[#2a2d2e] text-xs">
                  <span className="text-[#9cdcfe]">{v.name}</span>
                  <span className="text-[#858585]">=</span>
                  <span className={cn(
                    v.type === 'number' && "text-[#b5cea8]",
                    v.type === 'string' && "text-[#ce9178]",
                    v.type === 'boolean' && "text-[#569cd6]",
                    v.type === 'array' && "text-[#4ec9b0]",
                    v.type === 'object' && "text-[#4ec9b0]"
                  )}>
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Call Stack */}
        <div className="border-b border-[#3c3c3c]">
          <div 
            onClick={() => setCallStackExpanded(!callStackExpanded)}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] text-xs text-[#cccccc]"
          >
            {callStackExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Layers size={14} className="text-[#858585]" />
            <span className="font-medium">Call Stack</span>
          </div>
          
          {callStackExpanded && (
            <div className="pb-2">
              {callStack.map((frame, i) => (
                <div key={i} className="flex items-center gap-2 px-7 py-1 hover:bg-[#2a2d2e] text-xs cursor-pointer">
                  <span className="text-[#dcdcaa]">{frame.name}</span>
                  <span className="text-[#858585]">{frame.file}:{frame.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Breakpoints */}
        <div>
          <div 
            onClick={() => setBreakpointsExpanded(!breakpointsExpanded)}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] text-xs text-[#cccccc]"
          >
            {breakpointsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Circle size={14} className="text-red-500 fill-red-500" />
            <span className="font-medium">Breakpoints</span>
            <span className="text-[#858585]">({breakpoints.length})</span>
          </div>
          
          {breakpointsExpanded && (
            <div className="pb-2">
              {breakpoints.map((bp, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-1 hover:bg-[#2a2d2e] text-xs">
                  <input 
                    type="checkbox" 
                    checked={bp.enabled}
                    onChange={() => onShowComingSoon?.('Toggle Breakpoint')}
                    className="w-3 h-3 accent-red-500"
                  />
                  <Circle size={10} className={cn(
                    bp.enabled ? "text-red-500 fill-red-500" : "text-[#858585]"
                  )} />
                  <span className="text-[#cccccc]">{bp.file}</span>
                  <span className="text-[#858585]">:{bp.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Debug Console */}
      <div className="border-t border-[#3c3c3c] p-2">
        <div className="flex items-center gap-2 text-xs text-[#858585] mb-1">
          <Terminal size={12} />
          Debug Console
        </div>
        <div className="h-16 bg-[#1e1e1e] rounded p-2 text-xs font-mono text-[#6e6e6e] overflow-auto">
          {isDebugging ? (
            <div className="text-[#cccccc]">Debugger attached. Waiting for breakpoint...</div>
          ) : (
            <div>Start debugging to see output here</div>
          )}
        </div>
      </div>
    </div>
  );
}