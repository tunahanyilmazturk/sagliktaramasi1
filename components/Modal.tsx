
import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transform transition-all scale-100 opacity-100 animate-[fadeIn_0.2s_ease-out] border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
