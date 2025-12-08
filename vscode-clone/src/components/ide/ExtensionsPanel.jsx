import React, { useState, useEffect } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { registry } from '@/modules/core/ExtensionRegistry';

export default function ExtensionsPanel({ onSelectExtension }) {
  const [extensions, setExtensions] = useState([]);

  useEffect(() => {
    // 🔥 Registry se installed extensions ki list lo
    const loadedExtensions = registry.extensions.map(ext => ext.metadata);
    setExtensions(loadedExtensions);
  }, []);

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col text-white">
      {/* Header */}
      <div className="p-3 border-b border-[#3c3c3c] flex justify-between items-center">
         <span className="text-xs font-bold text-[#bbbbbb] uppercase">INSTALLED</span>
         <RefreshCw size={14} className="cursor-pointer text-[#858585] hover:text-white" onClick={() => window.location.reload()}/>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-0">
         {extensions.length === 0 ? (
            <div className="p-4 text-center text-[#858585] text-xs">
               <Package size={32} className="mx-auto mb-2 opacity-50"/>
               <p>No internal extensions loaded.</p>
            </div>
         ) : (
            extensions.map((ext) => (
               <div 
                 key={ext.id} 
                 onClick={() => onSelectExtension && onSelectExtension(ext)}
                 className="p-3 border-b border-[#3c3c3c] hover:bg-[#2a2d2e] group cursor-pointer"
               >
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-[#3c3c3c] rounded flex items-center justify-center text-[#007acc]">
                            <Package size={16} />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-[#cccccc]">{ext.name}</h4>
                            <p className="text-[10px] text-[#858585]">v{ext.version} • {ext.author}</p>
                         </div>
                      </div>
                  </div>
                  <p className="text-xs text-[#858585] mt-2 line-clamp-2">{ext.description}</p>
               </div>
            ))
         )}
      </div>
    </div>
  );
}