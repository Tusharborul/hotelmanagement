import React from 'react';

export default function Spinner({ size = 'md', label = '', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span className={`inline-block ${sizeClass} rounded-full border-2 border-gray-300 border-t-transparent animate-spin`} />
      {label ? <span className="text-sm text-gray-600">{label}</span> : null}
    </div>
  );
}
