import React, { useState } from 'react';
import { X, File, FileCode, FileJson, FileText, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Icon Helper
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    js: { icon: FileCode, color: 'text-yellow-400' },
    jsx: { icon: FileCode, color: 'text-blue-400' },
    css: { icon: FileCode, color: 'text-blue-300' },
    html: { icon: FileCode, color: 'text-orange-500' },
    json: { icon: FileJson, color: 'text-yellow-500' },
    md: { icon: FileText, color: 'text-white' },
  };
  return icons[ext] || { icon: File, color: 'text-[#858585]' };
};

export default function EditorTabs({ openFiles, activeFile, onTabClick, onTabClose, unsavedFiles }) {
  
  if (openFiles.length === 0) return null;

  return (
    // 🔥 Overflow-X Auto added to fix hiding issue
    <div className="h-9 bg-[#252526] flex items-end overflow-x-auto custom-scrollbar border-b border-[#252526] flex-shrink-0">
      {openFiles.map((file) => {
        const { icon: Icon, color } = getFileIcon(file.name);
        // 🔥 Check agar file unsaved list me hai
        const isDirty = unsavedFiles && unsavedFiles.has(file.id);

        return (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger>
              <div
                className={cn(
                  "h-9 flex items-center gap-2 px-3 cursor-pointer min-w-fit border-r border-[#1e1e1e] group select-none pr-2",
                  activeFile?.id === file.id 
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]" 
                    : "bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2d2e]"
                )}
                onClick={() => onTabClick(file)}
              >
                <Icon size={14} className={color} />
                <span className={cn("text-xs truncate max-w-[150px]", isDirty && "text-yellow-100")}>
                  {file.name}
                </span>
                
                {/* 🔥 Logic: Agar Dirty hai to Dot, nahi to Close button */}
                <div className="w-5 h-5 flex items-center justify-center ml-1 rounded hover:bg-[#3c3c3c]"
                     onClick={(e) => { e.stopPropagation(); onTabClose(file); }}>
                  
                  {isDirty ? (
                    // White Dot (Dirty State)
                    <div className="w-2 h-2 bg-white rounded-full group-hover:hidden" />
                  ) : null}

                  {/* Close Icon (Hover karne par ya agar dirty nahi hai tab dikhega) */}
                  <X size={14} className={cn(isDirty ? "hidden group-hover:block" : "block")} />
                
                </div>
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="bg-[#252526] border-[#454545] text-white">
              <ContextMenuItem onClick={() => onTabClose(file)}>Close</ContextMenuItem>
              <ContextMenuItem onClick={() => {}}>Close Others</ContextMenuItem>
              <ContextMenuItem onClick={() => {}}>Close All</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}