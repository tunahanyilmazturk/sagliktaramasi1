
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-slate-200 dark:border-slate-700 mt-4 animate-fade-in-up">
      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span>Toplam <strong>{totalItems}</strong> kayıttan <strong>{startItem}-{endItem}</strong> arası gösteriliyor</span>
        <span className="hidden sm:inline">|</span>
        <div className="flex items-center gap-2">
            <span>Sayfa başı:</span>
            <select 
                value={itemsPerPage}
                onChange={(e) => {
                    onItemsPerPageChange(Number(e.target.value));
                    onPageChange(1); // Reset to first page
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
            </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page could be more complex, 
                // keeping it simple for now (1,2,3,4,5 or sliding window)
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    // Cap at totalPages
                    if (pageNum > totalPages) pageNum = i + 1 + (totalPages - 5); 
                }
                
                if (pageNum > totalPages || pageNum < 1) return null;

                return (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                    >
                        {pageNum}
                    </button>
                );
            })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
