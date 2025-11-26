import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, children, open, onClose, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  const dialogRef = useRef(null);
  const prevActiveElementRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // close on ESC
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Focus management - only run once when modal opens
  useEffect(() => {
    if (open && !hasInitializedRef.current) {
      // Store previous active element only when modal first opens
      prevActiveElementRef.current = document.activeElement;
      hasInitializedRef.current = true;
    } else if (!open && hasInitializedRef.current) {
      // Restore focus when modal closes
      try { prevActiveElementRef.current?.focus?.(); } catch (e) {}
      hasInitializedRef.current = false;
    }
  }, [open]);

  // Prevent background scrolling while modal is mounted
  useEffect(() => {
    // When the modal mounts (component rendered) add class; cleanup removes it
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Render in a portal to avoid stacking context issues with fixed headers/sidebars
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center px-4 py-6 md:py-12 animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} mx-auto transform transition-all duration-300 animate-slide-up`}
        style={{ maxHeight: '100vh' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100" style={{ maxHeight: '80vh' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-blue-50 to-white border-b border-gray-200 shrink-0">
            <div className="font-bold text-lg text-gray-800">{title}</div>
            <button aria-label="Close" className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 transform hover:scale-110" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="p-6 overflow-auto" style={{ flex: '1 1 auto' }}>
            {children}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
