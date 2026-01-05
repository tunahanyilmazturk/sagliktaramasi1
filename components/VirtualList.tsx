import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 5 
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.length > 0 ? visibleItems[0].index * itemHeight : 0;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="virtual-list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage example for staff list
export const VirtualStaffList: React.FC<{ staff: any[] }> = ({ staff }) => {
  const renderItem = (staffMember: any, index: number) => (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {staffMember.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{staffMember.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{staffMember.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          staffMember.status === 'Active' 
            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
        }`}>
          {staffMember.status}
        </span>
      </div>
    </div>
  );

  return (
    <VirtualList
      items={staff}
      itemHeight={73}
      containerHeight={400}
      renderItem={renderItem}
    />
  );
};
