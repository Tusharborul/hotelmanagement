import React, { useEffect, useRef } from 'react';

export default function Modal({ title, children, open, onClose, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  const dialogRef = useRef(null);

  // close on ESC and focus management
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    // move focus into modal
    const prev = document.activeElement;
    setTimeout(() => { dialogRef.current?.focus(); }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      try { prev?.focus?.(); } catch (e) {}
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center px-4 py-6 md:py-12">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      {/* Dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} mx-auto`}
        style={{ maxHeight: '100vh' }}
      >
        <div className="bg-white rounded shadow-lg overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="font-semibold">{title}</div>
            <button aria-label="Close" className="text-gray-600 hover:text-gray-800" onClick={onClose}>✕</button>
          </div>

          {/* Scrollable body */}
          <div className="p-4 overflow-auto" style={{ flex: '1 1 auto' }}>
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
