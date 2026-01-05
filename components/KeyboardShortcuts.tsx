import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './Button';
import { commonShortcuts } from '../hooks/useKeyboardNavigation';

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const ShortcutItem: React.FC<{ 
    keys: string[]; 
    description: string; 
  }> = ({ keys, description }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {description}
      </span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-xs text-slate-400 mx-1">+</span>}
            <kbd className="px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Klavye Kısayolları
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                icon={<X size={18} />}
              />
            </div>
            
            <div className="p-6 space-y-1">
              <ShortcutItem
                keys={['Ctrl', 'B']}
                description={commonShortcuts.toggleSidebar.description}
              />
              <ShortcutItem
                keys={['/']}
                description={commonShortcuts.focusSearch.description}
              />
              <ShortcutItem
                keys={['Ctrl', 'N']}
                description={commonShortcuts.createNew.description}
              />
              <ShortcutItem
                keys={['Alt', 'N']}
                description={commonShortcuts.notifications.description}
              />
              <ShortcutItem
                keys={[',']}
                description={commonShortcuts.settings.description}
              />
              <ShortcutItem
                keys={['?']}
                description={commonShortcuts.help.description}
              />
              <ShortcutItem
                keys={['Ctrl', 'Shift', 'Q']}
                description={commonShortcuts.logout.description}
              />
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                İpucu: Kısayolları kullanmak için '?' tuşuna basabilirsiniz
              </p>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-12 w-12 rounded-full bg-slate-900 dark:bg-slate-700 text-white shadow-lg flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors z-40"
        title="Klavye Kısayolları"
      >
        <Keyboard size={20} />
      </button>
    </>
  );
};
