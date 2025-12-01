import React, { useEffect, useRef, useState } from 'react';

export default function Select({
  value,
  onChange = () => {},
  options = [],
  placeholder = '',
  disabled = false,
  className = '',
  name,
  id,
  ariaLabel,
  unstyled = false,
  icon = null,
  iconAlt = '',
  iconClass = 'mr-3 shrink-0 w-5 h-5'
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const getKey = (opt) => opt?.value ?? opt?._id ?? opt?.id ?? opt;
  const getLabel = (opt) => opt?.label ?? opt?.name ?? opt;

  const selectedLabel = () => {
    const found = (Array.isArray(options) ? options : []).find(o => String(getKey(o)) === String(value));
    return found ? getLabel(found) : (placeholder || '');
  };

  const toggle = () => { if (!disabled) setOpen(v => !v); };

  const baseBtnClass = `w-full text-sm font-medium px-3 py-2 rounded-xl border-2 flex items-center justify-between ${disabled ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-blue-100 hover:border-blue-300 bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200`;

  return (
    <div ref={rootRef} className={`relative ${className}`} id={id} aria-label={ariaLabel}>
      <button type="button" className={unstyled ? `w-full text-sm px-0 py-0 ${disabled ? 'text-gray-400' : 'text-gray-700'}` : baseBtnClass} onClick={toggle} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        {icon ? (
          typeof icon === 'string' ? <img src={icon} alt={iconAlt} className={iconClass} /> : <span className={iconClass}>{icon}</span>
        ) : null}
        <span className={`${(unstyled ? '' : 'truncate')} text-sm flex-1 text-left ml-2`}>{selectedLabel()}</span>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
      </button>

      {open && (
        <ul role="listbox" tabIndex={-1} className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto focus:outline-none">
          {placeholder !== null && <li key="__placeholder" className={`px-3 py-2 text-sm ${value === '' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`} onClick={() => { onChange(''); setOpen(false); }}>{placeholder}</li>}
          {Array.isArray(options) && options.map(opt => {
            const k = getKey(opt);
            const label = getLabel(opt);
            const isSelected = String(k) === String(value);
            return (
              <li key={k} role="option" aria-selected={isSelected} className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-600 text-white font-semibold' : 'text-gray-700'}`} onClick={() => { onChange(k); setOpen(false); }}>
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
