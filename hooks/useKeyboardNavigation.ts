import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Common shortcuts for the application
export const commonShortcuts = {
  toggleSidebar: {
    key: 'b',
    ctrlKey: true,
    description: 'Kenar çubuğunu aç/kapat',
  },
  focusSearch: {
    key: '/',
    description: 'Arama alanına odaklan',
  },
  createNew: {
    key: 'n',
    ctrlKey: true,
    description: 'Yeni kayıt oluştur',
  },
  notifications: {
    key: 'n',
    altKey: true,
    description: 'Bildirimleri aç',
  },
  settings: {
    key: ',',
    description: 'Ayarları aç',
  },
  help: {
    key: '?',
    description: 'Yardım menüsünü aç',
  },
  logout: {
    key: 'q',
    ctrlKey: true,
    shiftKey: true,
    description: 'Çıkış yap',
  },
};
