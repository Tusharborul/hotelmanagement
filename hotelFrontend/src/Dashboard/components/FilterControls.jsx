import React from 'react';
import calendar from '../../assets/Logos/Frame.png';
import locationIcon from '../../assets/Logos/add_location_alt.png';

export default function FilterControls({ start, end, field, selectedHotel, hotels = [], onChangeStart = () => {}, onChangeEnd = () => {}, onChangeField = () => {}, onChangeSelectedHotel = () => {}, onReset = () => {}, onFilter = () => {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 items-end">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Start</label>
        <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
          <img src={calendar} alt="calendar" className="w-5 h-5 mr-3 shrink-0" />
          <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="start" value={start} onChange={(e) => onChangeStart(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">End</label>
        <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
          <img src={calendar} alt="calendar" className="w-5 h-5 mr-3 shrink-0" />
          <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="end" value={end} onChange={(e) => onChangeEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Filter by</label>
        <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
          <select name="field" value={field} onChange={(e) => onChangeField(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer appearance-none pr-2" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}>
            <option value="created">Created</option>
            <option value="checkin">Check-in</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Hotel</label>
        <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
          <img src={locationIcon} alt="hotel" className="w-5 h-5 mr-3 shrink-0" />
          <select name="selectedHotel" value={selectedHotel} onChange={(e) => onChangeSelectedHotel(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer appearance-none pr-2" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}>
            <option value="">All Hotels</option>
            {hotels.map(h => <option key={h._id || h.id} value={h._id || h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onReset} className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
        </button>
        <button className="bg-blue-600 text-white rounded px-4 py-2 text-sm" onClick={onFilter}>Filter</button>
      </div>
    </div>
  );
}
