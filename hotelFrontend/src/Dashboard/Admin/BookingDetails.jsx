import React, { useEffect, useState } from 'react';
import FilterControls from '../components/FilterControls';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminBookingDetails() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [data, setData] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // load supports overrides so callers can trigger filtering immediately
  const load = async (p = 1, overrides = {}) => {
    const s = overrides.start !== undefined ? overrides.start : start;
    const e = overrides.end !== undefined ? overrides.end : end;
    const sel = overrides.selectedHotel !== undefined ? overrides.selectedHotel : selectedHotel;
    const f = overrides.field !== undefined ? overrides.field : field;

    const res = await adminService.getBookings({ start: s, end: e, page: p, limit, field: f === 'checkin' ? 'checkin' : undefined });
    let items = res.data || [];

    // client-side hotel filter: if selectedHotel is empty -> all hotels
    if (sel) {
      items = (items || []).filter(b => (b.hotel && (b.hotel._id || b.hotel.id) === sel) || b.hotelId === sel);
    }

    // Client-side fallback: if 'checkin' filter selected, ensure we filter by booking.checkInDate
    if (f === 'checkin' && (s || e)) {
      const ss = s ? new Date(s) : null;
      const ee = e ? (() => { const d = new Date(e); d.setHours(23,59,59,999); return d; })() : null;
      items = (items || []).filter(b => {
        if (!b.checkInDate) return false;
        const d = new Date(b.checkInDate);
        if (ss && d < ss) return false;
        if (ee && d > ee) return false;
        return true;
      });
    }

    setData(items);
    // If we performed client-side filtering, update total to the filtered count so pagination reflects results
    setTotal((f === 'checkin' && (s || e)) ? items.length : (sel ? items.length : res.total));
    setPage(res.page);
  };

  // initial load
  useEffect(()=>{ load(1); }, []);

  const onReset = () => {
    // clear state and trigger load with overrides so API call uses cleared values immediately
    setStart('');
    setEnd('');
    setField('created');
    setSelectedHotel('');
    load(1, { start: '', end: '', field: 'created', selectedHotel: '' });
  };
  useEffect(()=>{
    (async ()=>{
      try {
        const r = await adminService.getHotels({ page:1, limit: 1000 });
        setHotels(r.data || []);
        // default to All Hotels
        setSelectedHotel('');
      } catch (err) { console.warn('Failed to load hotels', err); }
    })();
  }, []);



  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Booking Details">
      
        <FilterControls
          start={start}
          end={end}
          field={field}
          selectedHotel={selectedHotel}
          hotels={hotels}
          onChangeStart={(v) => { setStart(v); load(1, { start: v }); }}
          onChangeEnd={(v) => { setEnd(v); load(1, { end: v }); }}
          onChangeField={(v) => { setField(v); load(1, { field: v }); }}
          onChangeSelectedHotel={(v) => { setSelectedHotel(v); load(1, { selectedHotel: v }); }}
          onReset={onReset}
          onFilter={() => load(1)}
        />

        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {data?.map(b => (
              <div key={b._id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-gray-500">User:</span>
                    <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded h-fit ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Hotel:</span>
                  <div className="text-sm">{b.hotel?.name}</div>
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
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{new Date(b.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {b.refundStatus && b.refundStatus !== 'none' && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-500">Refund:</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700">{b.refundStatus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">User</th>
                  <th className="py-2">Hotel</th>
                  <th className="py-2">Check-in</th>
                  <th className="py-2">Days</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.map(b => (
                  <tr key={b._id} className="border-b">
                    <td className="py-2">{b.user?.name || b.user?.username}</td>
                    <td className="py-2">{b.hotel?.name}</td>
                    <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</td>
                    <td className="py-2">{b.days}</td>
                    <td className="py-2">${b.totalPrice}</td>
                    <td className="py-2">{b.status}{b.refundStatus && b.refundStatus !== 'none' ? ` / ${b.refundStatus}` : ''}</td>
                    <td className="py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Next</button>
        </div>
   
    </Layout>
  );
}
