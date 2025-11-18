import React from 'react';

export default function FilterControls({ start, end, field, selectedHotel, hotels = [], onChangeStart = () => {}, onChangeEnd = () => {}, onChangeField = () => {}, onChangeSelectedHotel = () => {}, onReset = () => {}, onFilter = () => {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 items-end">
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Start</label>
        <div className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="start" value={start} onChange={(e) => onChangeStart(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">End</label>
        <div className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="end" value={end} onChange={(e) => onChangeEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Filter by</label>
        <div className="relative flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300">
          <select name="field" value={field} onChange={(e) => onChangeField(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer pr-7">
            <option value="created">Created</option>
            <option value="checkin">Check-in</option>
          </select>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 absolute right-3 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Hotel</label>
        <div className="relative flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <select name="selectedHotel" value={selectedHotel} onChange={(e) => onChangeSelectedHotel(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer pr-7">
            <option value="">All Hotels</option>
            {hotels.map(h => <option key={h._id || h.id} value={h._id || h.id}>{h.name}</option>)}
          </select>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 absolute right-3 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
        </div>
      </div>

      <div className="flex gap-2 justify-start">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300 text-sm font-medium text-gray-700"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
}
