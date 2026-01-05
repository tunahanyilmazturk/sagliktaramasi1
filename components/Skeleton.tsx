import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = React.memo(({ 
  className = '', 
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '40px'),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            style={{
              width: i === lines - 1 ? '70%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Preset skeletons for common use cases
export const CardSkeleton: React.FC = React.memo(() => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton width={80} height={20} />
    </div>
    <Skeleton lines={3} />
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

export const TableSkeleton: React.FC<{ rows?: number }> = React.memo(({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
      <Skeleton width={200} height={20} />
    </div>
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={14} />
            </div>
            <Skeleton width={100} height={32} variant="rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

export const StatsCardSkeleton: React.FC = React.memo(() => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="rounded" width={48} height={48} />
      <Skeleton width={60} height={16} />
    </div>
    <Skeleton width={120} height={28} className="mb-2" />
    <Skeleton width={80} height={14} />
  </div>
));

StatsCardSkeleton.displayName = 'StatsCardSkeleton';

export const ListSkeleton: React.FC<{ items?: number }> = React.memo(({ items = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="70%" height={16} className="mb-2" />
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={24} height={24} variant="rounded" />
      </div>
    ))}
  </div>
));

ListSkeleton.displayName = 'ListSkeleton';
