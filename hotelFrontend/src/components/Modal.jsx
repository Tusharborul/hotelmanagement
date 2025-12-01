import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, children, open, onClose, size = 'md' }) {

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const dialogRef = useRef(null);
  const prevActiveElementRef = useRef(null);
  const titleIdRef = useRef(`modal-title-${Math.random().toString(36).slice(2,9)}`);

  // helper: selectors for focusable elements
  const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

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
    if (open) {
      // store previously focused element so we can restore focus later
      prevActiveElementRef.current = document.activeElement;

      // move focus into the modal when it opens (wait a tick to ensure children rendered)
      setTimeout(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const nodes = Array.from(dialog.querySelectorAll(focusableSelector));
        const visible = nodes.filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0 || n.getClientRects().length);
        if (visible.length) visible[0].focus();
        else dialog.focus();
      }, 0);
    } else {
      // restore focus when modal closes
      try { prevActiveElementRef.current?.focus?.(); } catch (e) {}
    }
  }, [open]);

  // Prevent background scrolling while modal is visible
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [open]);
  // Focus trap: keep Tab/Shift+Tab cycling inside modal
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(dialog.querySelectorAll(focusableSelector)).filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0 || n.getClientRects().length);
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // If not open, render nothing (hooks above still run every render)
  if (!open) return null;

  // Render in a portal to avoid stacking context issues with fixed headers/sidebars
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center px-4 py-6 md:py-12 animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleIdRef.current}
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} mx-auto transform transition-all duration-300 animate-slide-up`}
        style={{ maxHeight: '100vh' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100" style={{ maxHeight: size === 'xl' ? '90vh' : '80vh' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-blue-50 to-white border-b border-gray-200 shrink-0">
            <div id={titleIdRef.current} className="font-bold text-lg text-gray-800">{title}</div>
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
