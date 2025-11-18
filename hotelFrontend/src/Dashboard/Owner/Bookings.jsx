import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';
import { formatDateTime } from '../../utils/date';
import Pagination from '../../components/Pagination';
import { formatINR } from '../../utils/currency';

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

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
        if (f === 'checkin') {
          // Treat the filter range as an occupancy window and include bookings
          // that overlap the selected range: booking.checkInDate <= ee && booking.checkOutDate > ss
          const ci = b.checkInDate ? new Date(b.checkInDate) : null;
          const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
          if (!ci || !co) return false;
          // normalize
          if (ss) ss.setHours(0,0,0,0);
          if (ee) ee.setHours(23,59,59,999);
          if (ss && ee) {
            return ci.getTime() <= ee.getTime() && co.getTime() > ss.getTime();
          }
          if (ss && !ee) {
            return co.getTime() > ss.getTime();
          }
          if (!ss && ee) {
            return ci.getTime() <= ee.getTime();
          }
          return true;
        }
        const val = b.createdAt;
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
    const p = overrides.page !== undefined ? overrides.page : 1;

    if (sel) {
      try {
        const r = await bookingService.getHotelBookings(sel);
        const list = Array.isArray(r) ? r : (r?.data || []);
        const hotelMeta = (hotels || []).find(h => h._id === sel) || { _id: sel, name: '' };
        const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: hotelMeta._id, name: hotelMeta.name }, hotelName: (b.hotel && b.hotel.name) || hotelMeta.name }));
        const filtered = filterByRange(mapped, s, e, f);
        const tot = filtered.length;
        const startIdx = (p - 1) * limit;
        const pageItems = filtered.slice(startIdx, startIdx + limit);
        setBookings(pageItems);
        setTotal(tot);
        setPage(p);
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
      const filtered = filterByRange(all, s, e, f);
      const tot = filtered.length;
      const startIdx = (p - 1) * limit;
      const pageItems = filtered.slice(startIdx, startIdx + limit);
      setBookings(pageItems);
      setTotal(tot);
      setPage(p);
    }
  };

  const clearFilter = () => { setDate(''); setStart(''); setEnd(''); setField('created'); setSelected(''); applyFilter({ start: '', end: '', field: 'created', selected: '' }); };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Bookings">
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Bookings Management</div>
      
        <div className="mb-6">
          <FilterControls
            start={start}
            end={end}
            field={field}
            selectedHotel={selected}
            hotels={hotels}
            onChangeStart={(v) => { setStart(v); applyFilter({ start: v, page: 1 }); }}
            onChangeEnd={(v) => { setEnd(v); applyFilter({ end: v, page: 1 }); }}
            onChangeField={(v) => { setField(v); applyFilter({ field: v, page: 1 }); }}
            onChangeSelectedHotel={(v) => { setSelected(v); applyFilter({ selected: v, page: 1 }); }}
            onReset={clearFilter}
            onFilter={() => applyFilter()}
          />
        </div>

        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {bookings.map(b => (
              <div key={b._id} className="border-2 border-blue-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
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
                    <div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Days:</span>
                    <div className="text-sm">{b.days}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total:</span>
                    <div className="text-sm font-semibold">{formatINR(b.totalPrice)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    <div>
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                        b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                        b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                        'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
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
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="w-full text-left">
              <thead><tr className="bg-linear-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200"><th className="py-4 px-6 font-semibold text-gray-700">User</th><th className="py-4 px-6 font-semibold text-gray-700">Hotel</th><th className="py-4 px-6 font-semibold text-gray-700">Check-in</th><th className="py-4 px-6 font-semibold text-gray-700">Days</th><th className="py-4 px-6 font-semibold text-gray-700">Total</th><th className="py-4 px-6 font-semibold text-gray-700">Status</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                    <td className="py-4 px-6 font-medium text-gray-800">{b.user?.name || b.user?.username}</td>
                    <td className="py-4 px-6 text-gray-600">{b.hotel?.name || b.hotelName || '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{b.days}</td>
                    <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                    <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                      b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                      b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                      'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                    }`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>applyFilter({ page: p })} className="mt-6" />
  
    </Layout>
  );
}
