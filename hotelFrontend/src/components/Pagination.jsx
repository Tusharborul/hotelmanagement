import React from 'react';

function range(start, end) {
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export default function Pagination({ page = 1, total = 0, limit = 10, onPageChange, siblings = 1, boundaries = 1, className = '' }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  const current = Math.min(Math.max(1, page), totalPages);

  const goTo = (p) => {
    if (!onPageChange) return;
    const target = Math.min(Math.max(1, p), totalPages);
    if (target !== current) onPageChange(target);
  };

  // Build page items with ellipses
  const startPages = range(1, Math.min(boundaries, totalPages));
  const endPages = range(Math.max(totalPages - boundaries + 1, boundaries + 1), totalPages);

  const leftSiblingStart = Math.max(current - siblings, boundaries + 1);
  const rightSiblingEnd = Math.min(current + siblings, totalPages - boundaries);

  const items = [];

  // Start pages
  startPages.forEach((p) => items.push(p));

  // Left ellipsis
  if (leftSiblingStart > boundaries + 1) {
    items.push('left-ellipsis');
  }

  // Sibling pages
  for (let p = leftSiblingStart; p <= rightSiblingEnd; p++) {
    if (p >= 1 && p <= totalPages) items.push(p);
  }

  // Right ellipsis
  if (rightSiblingEnd < totalPages - boundaries) {
    items.push('right-ellipsis');
  }

  // End pages
  endPages.forEach((p) => {
    if (!items.includes(p)) items.push(p);
  });

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <button
        type="button"
        aria-label="Previous page"
        disabled={current <= 1}
        onClick={() => goTo(current - 1)}
        className="px-3.5 py-2 rounded-lg border text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {items.map((it, idx) => (
        it === 'left-ellipsis' || it === 'right-ellipsis' ? (
          <span key={it + idx} className="px-2 text-gray-500 select-none">…</span>
        ) : (
          <button
            type="button"
            key={it}
            aria-current={it === current ? 'page' : undefined}
            onClick={() => goTo(it)}
            className={`min-w-9 px-3 py-2 rounded-lg border text-sm font-medium ${
              it === current
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {it}
          </button>
        )
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={current >= totalPages}
        onClick={() => goTo(current + 1)}
        className="px-3.5 py-2 rounded-lg border text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}
