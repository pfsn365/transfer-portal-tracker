import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 3; // Show 3 pages at a time

    if (totalPages <= maxVisible) {
      // Show all pages if total is 3 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate which 3 pages to show based on current page
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

      // Adjust if we're near the end
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-base text-gray-600 hidden sm:inline">
            {totalItems > 0 ? `${startItem}-${endItem} of ${totalItems}` : '0 players'}
          </span>
        </div>

        {/* Page numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 sm:gap-2 justify-center flex-wrap">
            {/* Previous button */}
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700 cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next button */}
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Mobile item count */}
        <span className="text-base text-gray-600 sm:hidden text-center">
          {totalItems > 0 ? `${startItem}-${endItem} of ${totalItems}` : '0 players'}
        </span>
      </div>
    </div>
  );
}
