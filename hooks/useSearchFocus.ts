import React, { useEffect, useCallback } from 'react';

export const useSearchFocus = (searchInputRef: React.RefObject<HTMLInputElement>) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Focus search on '/' key
    if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
      const target = event.target as HTMLElement;
      
      // Don't trigger if already typing in an input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    }
  }, [searchInputRef]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
