import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, ChevronDown, Building, User, Tag } from 'lucide-react';
import { Button } from './Button';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  type: 'select' | 'date' | 'text';
}

interface AdvancedFilterProps {
  filters: FilterGroup[];
  activeFilters: Record<string, string[] | undefined>;
  onFilterChange: (key: string, values: string[]) => void;
  onClearAll: () => void;
  className?: string;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const filteredFilters = useMemo(() => {
    if (!searchTerm) return filters;
    
    return filters.map(group => ({
      ...group,
      options: group.options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.options.length > 0);
  }, [filters, searchTerm]);

  const activeFilterCount = Object.values(activeFilters).reduce(
    (sum, values) => sum + (values?.length || 0),
    0
  );

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(k => k !== groupKey)
        : [...prev, groupKey]
    );
  };

  const handleFilterToggle = (groupKey: string, value: string) => {
    const currentValues = activeFilters[groupKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(groupKey, newValues);
  };

  const removeFilter = (groupKey: string, value: string) => {
    const currentValues = activeFilters[groupKey] || [];
    const newValues = currentValues.filter(v => v !== value);
    onFilterChange(groupKey, newValues);
  };

  const getActiveFilterLabel = (groupKey: string, value: string) => {
    const group = filters.find(g => g.key === groupKey);
    const option = group?.options.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${(activeFilterCount || 0) > 0 ? 'border-violet-500 text-violet-600 dark:text-violet-400' : ''}`}
        icon={<Filter size={18} />}
      >
        Filtreler
        {(activeFilterCount || 0) > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Active Filters */}
      {(activeFilterCount || 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([groupKey, values]) =>
            (values || []).map(value => (
              <div
                key={`${groupKey}-${value}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm"
              >
                <span>{getActiveFilterLabel(groupKey, value)}</span>
                <button
                  onClick={() => removeFilter(groupKey, value)}
                  className="hover:text-violet-900 dark:hover:text-violet-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
          <button
            onClick={onClearAll}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Temizle
          </button>
        </div>
      )}

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Filter Groups */}
          <div className="overflow-y-auto max-h-80">
            {filteredFilters.map(group => (
              <div key={group.key} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-400">
                      {group.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      expandedGroups.includes(group.key) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedGroups.includes(group.key) && (
                  <div className="px-4 pb-3 space-y-2">
                    {group.options.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters[group.key]?.includes(option.value) || false}
                          onChange={() => handleFilterToggle(group.key, option.value)}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span className="text-xs text-slate-400">
                            {option.count}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Kapat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
            >
              Tümünü Temizle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
