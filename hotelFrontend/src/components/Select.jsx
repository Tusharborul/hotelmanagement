import React from 'react';

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
  unstyled = false
}) {
  const styledClass = `appearance-none w-full bg-white text-sm font-medium text-gray-700 px-3 py-2.5 rounded-xl border-2 ${disabled ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-blue-100 hover:border-blue-300'} focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`;
  const unstyledClass = `appearance-none w-full bg-transparent text-sm font-medium text-gray-700 px-0 py-0 border-none focus:outline-none cursor-pointer ${disabled ? 'cursor-not-allowed text-gray-400' : ''}`;

  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        name={name}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={unstyled ? unstyledClass : styledClass}
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {Array.isArray(options) && options.map(opt => (
          <option key={opt.value ?? opt._id ?? opt.id} value={opt.value ?? opt._id ?? opt.id}>{opt.label ?? opt.name ?? opt}</option>
        ))}
      </select>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${unstyled ? 'text-gray-500' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
    </div>
  );
}
