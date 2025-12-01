import React from 'react';

export default function Spinner({ size = 'md', label = '', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10';
  const borderWidth = size === 'sm' ? 'border-2' : size === 'lg' ? 'border-4' : 'border-3';
  
  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite" aria-busy="true">
      <div className="relative">
        {/* Outer ring with gradient */}
        <span className={`inline-block ${sizeClass} rounded-full ${borderWidth} border-blue-200 border-t-blue-600 border-r-blue-500 animate-spin`} />
        {/* Inner glow effect */}
        <span className={`absolute inset-0 ${sizeClass} rounded-full bg-blue-400/10 blur-sm`} />
      </div>
      {label && <span className="text-sm font-medium text-gray-700 animate-pulse">{label}</span>}
    </div>
  );
}
