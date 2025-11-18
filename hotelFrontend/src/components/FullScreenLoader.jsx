import React from 'react';
import Spinner from './Spinner';

export default function FullScreenLoader({ label = 'Loading...', className = '' }) {
  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-1000 ${className}`}>
      <div className="bg-white px-5 py-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
        <Spinner />
        <div className="text-gray-800 font-medium text-sm">{label}</div>
      </div>
    </div>
  );
}
