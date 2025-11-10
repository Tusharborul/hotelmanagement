import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(()=>{ (async()=>{
    const res = await hotelService.getMyHotels();
    setHotels(res.data || []);
    // default to "All Hotels" (empty selection) instead of auto-selecting the first hotel
  })(); },[]);

  useEffect(()=>{ (async()=>{
    // load bookings for either selected hotel or all hotels
    const loadBookings = async () => {
      try {
        if (!selected) {
          // aggregate bookings for all hotels and attach hotel info when missing
          const all = [];
          for (const h of (hotels || [])) {
            try {
              const r = await bookingService.getHotelBookings(h._id);
              const list = Array.isArray(r) ? r : (r?.data || []);
              // ensure each booking has hotel info for display
              const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: h._id, name: h.name }, hotelName: (b.hotel && b.hotel.name) || h.name }));
              all.push(...mapped);
            } catch (err) {
              console.warn('Failed to load bookings for hotel', h._id, err);
            }
          }
          setBookings(filterByDate(all, date));
        } else {
          const r = await bookingService.getHotelBookings(selected);
          const list = Array.isArray(r) ? r : (r?.data || []);
          // Attach hotel info for display when fetching for a single selected hotel
          const hotelMeta = (hotels || []).find(h => h._id === selected) || { _id: selected, name: '' };
          const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: hotelMeta._id, name: hotelMeta.name }, hotelName: (b.hotel && b.hotel.name) || hotelMeta.name }));
          setBookings(filterByDate(mapped, date));
        }
      } catch (err) { console.error('Failed to load bookings', err); setBookings([]); }
    };

    loadBookings();
  })(); }, [selected, hotels]);

  // helper to filter list by date (if date provided)
  const filterByDate = (list, selectedDate) => {
    if (!selectedDate) return list;
    try {
      const target = new Date(selectedDate).toDateString();
      return (list || []).filter(b => {
        if (!b.checkInDate) return false;
        return new Date(b.checkInDate).toDateString() === target;
      });
    } catch (err) {
      return list;
    }
  };

  // provide a manual filter action (useful when changing date)
  const applyFilter = async () => {
    // trigger the same load logic by setting selected to itself (causes useEffect)
    if (selected) {
      // direct call for performance
      try {
        const r = await bookingService.getHotelBookings(selected);
        const list = Array.isArray(r) ? r : (r?.data || []);
        const hotelMeta = (hotels || []).find(h => h._id === selected) || { _id: selected, name: '' };
        const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: hotelMeta._id, name: hotelMeta.name }, hotelName: (b.hotel && b.hotel.name) || hotelMeta.name }));
        setBookings(filterByDate(mapped, date));
      } catch (err) { console.error(err); }
    } else {
      // aggregate and attach hotel info
      const all = [];
      for (const h of (hotels || [])) {
        try {
          const r = await bookingService.getHotelBookings(h._id);
          const list = Array.isArray(r) ? r : (r?.data || []);
          const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: h._id, name: h.name }, hotelName: (b.hotel && b.hotel.name) || h.name }));
          all.push(...mapped);
        } catch (err) { /* ignore per-hotel errors */ }
      }
      setBookings(filterByDate(all, date));
    }
  };

  const clearFilter = () => { setDate(''); applyFilter(); };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Bookings">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-full sm:w-72">
              <label className="block text-sm text-gray-600 mb-1 font-medium">Select Hotel</label>
              <select
                className="border rounded-md px-3 py-2 w-full h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 name="selected" value={selected}
                onChange={(e)=>setSelected(e.target.value)}
              >
                <option value="">All Hotels</option>
                {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-sm text-gray-600 mb-1 font-medium">Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 w-full h-10 text-sm"
                 name="date" value={date}
                onChange={(e)=>setDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={applyFilter} className="px-4 h-10 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700 w-full sm:w-auto">Filter</button>
              <button onClick={clearFilter} className="px-4 h-10 border rounded-md text-sm w-full sm:w-auto">Clear</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {bookings.map(b => (
              <div key={b._id} className="border rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">User:</span>
                  <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                </div>
                  <div>
                    <span className="text-xs text-gray-500">Hotel:</span>
                    <div className="text-sm">{b.hotel?.name || b.hotelName || '-'}</div>
                  </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Check-in:</span>
                    <div className="text-sm">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Days:</span>
                    <div className="text-sm">{b.days}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total:</span>
                    <div className="text-sm font-semibold">${b.totalPrice}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="py-2">User</th><th className="py-2">Hotel</th><th className="py-2">Check-in</th><th className="py-2">Days</th><th className="py-2">Total</th><th className="py-2">Status</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} className="border-b">
                    <td className="py-2">{b.user?.name || b.user?.username}</td>
                    <td className="py-2">{b.hotel?.name || b.hotelName || '-'}</td>
                    <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</td>
                    <td className="py-2">{b.days}</td>
                    <td className="py-2">${b.totalPrice}</td>
                    <td className="py-2">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
