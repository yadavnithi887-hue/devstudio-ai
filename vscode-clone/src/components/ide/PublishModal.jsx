import React, { useState, useEffect } from 'react';
import { X, Lock, Globe, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PublishModal({ isOpen, onClose, onPublish, files = [] }) {
  const [step, setStep] = useState(1); // 1: Name/Type, 2: Select Files
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setRepoName(''); // Name bhi reset kar do
        setIsPrivate(true);

        // Files ko sirf tab set karo jab modal khule
        // Baad me agar files update ho to selection mat hilana
        if(files.length > 0) {
            setSelectedFiles(files.map(f => f.path));
        }

        const currentFolder = localStorage.getItem('devstudio-last-project');
        // Default name set karo agar user ne nahi likha
        setRepoName(currentFolder ? currentFolder.split('\\').pop().split('/').pop() : 'my-project');
    }
    // 🔥 FIX: Dependency array se 'files' hata diya.
    // Ab ye sirf tab chalega jab Modal khulega/band hoga.
  }, [isOpen]);

  const toggleFile = (path) => {
    setSelectedFiles(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleNext = () => {
    if (!repoName.trim()) return;
    setStep(2);
  };

  const handleFinalPublish = () => {
    onPublish({ repoName, isPrivate, selectedFiles });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-10 z-[9999]">
      <div className="bg-[#252526] border border-[#454545] w-[500px] shadow-2xl rounded-md overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
          <span className="text-sm font-medium text-white">Publish to GitHub</span>
          <button onClick={onClose} className="text-[#858585] hover:text-white"><X size={16}/></button>
        </div>

        {/* Step 1: Repo Details */}
        {step === 1 && (
          <div className="p-4 space-y-4">
            <div>
                <label className="text-xs text-[#858585] block mb-1">Repository Name</label>
                <Input 
                    value={repoName} 
                    onChange={e => setRepoName(e.target.value)} 
                    className="bg-[#3c3c3c] border-[#454545] text-white focus:border-[#007acc]" 
                    placeholder="e.g. my-awesome-project"
                    autoFocus
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-xs text-[#858585] block">Visibility</label>
                <div 
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${isPrivate ? 'bg-[#094771] border-[#007acc]' : 'border-[#3c3c3c] hover:bg-[#2a2d2e]'}`}
                    onClick={() => setIsPrivate(true)}
                >
                    <Lock size={16} className="text-[#cccccc]" />
                    <div className="flex-1">
                        <div className="text-sm text-white">Private repository</div>
                        <div className="text-xs text-[#858585]">Only you can see this repository</div>
                    </div>
                </div>

                <div 
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${!isPrivate ? 'bg-[#094771] border-[#007acc]' : 'border-[#3c3c3c] hover:bg-[#2a2d2e]'}`}
                    onClick={() => setIsPrivate(false)}
                >
                    <Globe size={16} className="text-[#cccccc]" />
                    <div className="flex-1">
                        <div className="text-sm text-white">Public repository</div>
                        <div className="text-xs text-[#858585]">Anyone can see this repository</div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="bg-[#007acc] hover:bg-[#006bb3] text-white text-xs">Next: Select Files</Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Files */}
        {step === 2 && (
          <div className="flex flex-col h-[400px]">
             <div className="p-3 bg-[#2d2d2d] border-b border-[#3c3c3c]">
                <p className="text-xs text-[#cccccc]">Select files to include in the first commit:</p>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#2a2d2e] rounded cursor-pointer" onClick={() => toggleFile(file.path)}>
                        {selectedFiles.includes(file.path) 
                           ? <CheckSquare size={16} className="text-[#007acc]" /> 
                           : <Square size={16} className="text-[#858585]" />
                        }
                        <span className="text-sm text-[#cccccc]">{file.path}</span>
                    </div>
                ))}
             </div>

             <div className="p-3 border-t border-[#3c3c3c] flex justify-between items-center bg-[#252526]">
                <span className="text-xs text-[#858585]">{selectedFiles.length} files selected</span>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-[#cccccc] hover:bg-[#3c3c3c] text-xs">Back</Button>
                    <Button onClick={handleFinalPublish} className="bg-[#2da44e] hover:bg-[#2c974b] text-white text-xs">Publish to GitHub</Button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}