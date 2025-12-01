import React, { useRef } from 'react';
import Select from '../../components/Select';

export default function FilterControls({ start, end, field, selectedHotel, hotels = [], owners = [], selectedOwner = '', onChangeStart = () => {}, onChangeEnd = () => {}, onChangeField = () => {}, onChangeSelectedOwner = () => {}, onChangeSelectedHotel = () => {}, onReset = () => {}, onFilter = () => {} }) {
  const hasOwners = Array.isArray(owners) && owners.length > 0;
  const gridColsClass = hasOwners ? 'lg:grid-cols-6' : 'lg:grid-cols-5';
  const ownerObj = hasOwners ? (owners.find(o => (o._id || o.id) === selectedOwner) || null) : null;
  const ownerLabel = ownerObj ? (ownerObj.name || ownerObj.username || ownerObj.email || 'Owner') : 'Owner';
  const startRef = React.useRef(null);
  const endRef = React.useRef(null);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-3 mb-6 items-end`}>
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Start</label>
        <div
          className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300 cursor-pointer"
          onClick={() => {
            const el = startRef.current;
            if (!el) return;
            if (typeof el.showPicker === 'function') {
              try { el.showPicker(); return; } catch (e) { /* fallthrough */ }
            }
            // `click()` opens the picker on more browsers than `focus()`
            try { el.click(); return; } catch (e) { /* fallthrough */ }
            el.focus();
          }}
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <input ref={startRef} type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full cursor-pointer" name="start" value={start} onChange={(e) => onChangeStart(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">End</label>
        <div
          className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300 cursor-pointer"
          onClick={() => {
            const el = endRef.current;
            if (!el) return;
            if (typeof el.showPicker === 'function') {
              try { el.showPicker(); return; } catch (e) { /* fallthrough */ }
            }
            try { el.click(); return; } catch (e) { /* fallthrough */ }
            el.focus();
          }}
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <input ref={endRef} type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full cursor-pointer" name="end" value={end} onChange={(e) => onChangeEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Filter by</label>
        <div>
          <Select
            name="field"
            ariaLabel="Filter by"
            value={field}
            onChange={onChangeField}
            options={[{ value: 'created', label: 'Created' }, { value: 'checkin', label: 'Check-in' }]}
            placeholder={null}
          />
        </div>
      </div>

      {hasOwners && (
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Owner</label>
          <Select
            name="selectedOwner"
            ariaLabel="Owner"
            value={selectedOwner}
            onChange={onChangeSelectedOwner}
            options={(owners || []).map(o => ({ value: o._id || o.id, label: o.name || o.username || o.email }))}
            placeholder="All Owners"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Hotel</label>
        <Select
          name="selectedHotel"
          ariaLabel="Hotel"
          value={selectedHotel}
          onChange={onChangeSelectedHotel}
          options={Array.isArray(hotels) ? hotels.map(h => ({ value: h._id || h.id, label: h.name })) : []}
          placeholder={hasOwners && !selectedOwner ? 'Select owner to view hotels' : (hasOwners && selectedOwner ? `All ${ownerLabel}'s Hotels` : 'All Hotels')}
          disabled={hasOwners && !selectedOwner}
        />
      </div>

      <div className="flex gap-2 justify-start">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300 text-sm font-medium text-gray-700 cursor-pointer"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
}
