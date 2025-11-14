import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [bookings, setBookings] = useState([]);

  useEffect(()=>{ (async()=>{
    const res = await hotelService.getMyHotels();
    setHotels(res.data || []);
  })(); },[]);

  // Initial load when hotels list changes. Subsequent filter changes are applied immediately
  // via `applyFilter` called from onChange handlers to avoid waiting for setState.
  useEffect(()=>{ (async()=>{
    if (!hotels || hotels.length === 0) return;
    await applyFilter();
  })(); }, [hotels]);

  // helper to filter list by start/end and field (created or checkin)
  const filterByRange = (list, s, e, f) => {
    if (!s && !e) return list;
    try {
      const ss = s ? new Date(s) : null;
      const ee = e ? (() => { const d = new Date(e); d.setHours(23,59,59,999); return d; })() : null;
      return (list || []).filter(b => {
        const val = f === 'checkin' ? b.checkInDate : b.createdAt;
        if (!val) return false;
        const d = new Date(val);
        if (ss && d < ss) return false;
        if (ee && d > ee) return false;
        return true;
      });
    } catch (err) {
      return list;
    }
  };

  // provide a manual filter action (accepts overrides for immediate filtering)
  const applyFilter = async (overrides = {}) => {
    const sel = overrides.selected !== undefined ? overrides.selected : selected;
    const s = overrides.start !== undefined ? overrides.start : start;
    const e = overrides.end !== undefined ? overrides.end : end;
    const f = overrides.field !== undefined ? overrides.field : field;

    if (sel) {
      try {
        const r = await bookingService.getHotelBookings(sel);
        const list = Array.isArray(r) ? r : (r?.data || []);
        const hotelMeta = (hotels || []).find(h => h._id === sel) || { _id: sel, name: '' };
        const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: hotelMeta._id, name: hotelMeta.name }, hotelName: (b.hotel && b.hotel.name) || hotelMeta.name }));
        setBookings(filterByRange(mapped, s, e, f));
      } catch (err) { console.error(err); }
    } else {
      const all = [];
      for (const h of (hotels || [])) {
        try {
          const r = await bookingService.getHotelBookings(h._id);
          const list = Array.isArray(r) ? r : (r?.data || []);
          const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: h._id, name: h.name }, hotelName: (b.hotel && b.hotel.name) || h.name }));
          all.push(...mapped);
        } catch (err) { /* ignore per-hotel errors */ }
      }
      setBookings(filterByRange(all, s, e, f));
    }
  };

  const clearFilter = () => { setDate(''); setStart(''); setEnd(''); setField('created'); setSelected(''); applyFilter({ start: '', end: '', field: 'created', selected: '' }); };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Bookings">
      
        <div className="mb-4">
          <FilterControls
            start={start}
            end={end}
            field={field}
            selectedHotel={selected}
            hotels={hotels}
            onChangeStart={(v) => { setStart(v); applyFilter({ start: v }); }}
            onChangeEnd={(v) => { setEnd(v); applyFilter({ end: v }); }}
            onChangeField={(v) => { setField(v); applyFilter({ field: v }); }}
            onChangeSelectedHotel={(v) => { setSelected(v); applyFilter({ selected: v }); }}
            onReset={clearFilter}
            onFilter={() => applyFilter()}
          />
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
  
    </Layout>
  );
}
