import React, { useEffect, useState } from 'react';
import calendar from "../../assets/Logos/Frame.png";
import locationIcon from "../../assets/Logos/add_location_alt.png";
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';

export default function AdminRefunds() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  // load supports overrides so callers can trigger filtering immediately
  const load = async (p = 1, overrides = {}) => {
    setLoading(true);
    try {
      const s = overrides.start !== undefined ? overrides.start : start;
      const e = overrides.end !== undefined ? overrides.end : end;
      const sel = overrides.selectedHotel !== undefined ? overrides.selectedHotel : selectedHotel;
      const f = overrides.field !== undefined ? overrides.field : field;

      const res = await adminService.getBookings({ start: s, end: e, page: p, limit, field: f === 'checkin' ? 'checkin' : undefined });
      let all = res.data || [];

      // Client-side fallback: if filtering by check-in, ensure we filter by booking.checkInDate range
      if (f === 'checkin' && (s || e)) {
        const ss = s ? new Date(s) : null;
        const ee = e ? (() => { const d = new Date(e); d.setHours(23,59,59,999); return d; })() : null;
        all = (all || []).filter(b => {
          if (!b.checkInDate) return false;
          const d = new Date(b.checkInDate);
          if (ss && d < ss) return false;
          if (ee && d > ee) return false;
          return true;
        });
      }

      // if a hotel is selected, filter by hotel id (client-side)
      if (sel) {
        all = (all || []).filter(b => (b.hotel && (b.hotel._id || b.hotel.id) === sel) || b.hotelId === sel);
      }

      // keep only bookings that have refunds (refundAmount > 0) or pending refunds
      const refunds = all.filter(b => Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none'));
      setData(refunds);
      // If we applied client-side filtering, set total to the filtered count to reflect UI results
      setTotal((f === 'checkin' && (s || e)) ? refunds.length : (res.total || refunds.length));
      setPage(res.page || p);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => { load(1); }, []);
  useEffect(()=>{
    (async ()=>{
      try {
        const res = await adminService.getHotels({ page:1, limit: 1000 });
        setHotels(res.data || []);
        // default to All Hotels when hotels are loaded
        setSelectedHotel('');
      } catch(e){ console.warn('Failed to load hotels for admin refunds', e); }
    })();
  }, []);

  const adminIssueRefund = async (bookingId) => {
    try {
      await adminService.issueRefund(bookingId);
      load(page);
      showToast('Refund issued', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to issue refund';
      showToast(msg, 'error');
    }
  };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Refunds">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start</label>
            <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
              <img src={calendar} alt="calendar" className="w-5 h-5 mr-3 shrink-0" />
              <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="start" value={start} onChange={(e) => { setStart(e.target.value); load(1, { start: e.target.value }); }} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">End</label>
            <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
              <img src={calendar} alt="calendar" className="w-5 h-5 mr-3 shrink-0" />
              <input type="date" className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full" name="end" value={end} onChange={(e) => { setEnd(e.target.value); load(1, { end: e.target.value }); }} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Filter by</label>
            <div className="flex items-center bg-white rounded-lg px-3 py-2.5 shadow-inner border border-gray-100">
              <select name="field" value={field} onChange={(e) => { const v = e.target.value; setField(v); load(1, { field: v }); }} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer appearance-none pr-2" style={{
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
              <select name="selectedHotel" value={selectedHotel} onChange={(e) => { const v = e.target.value; setSelectedHotel(v); load(1, { selectedHotel: v }); }} className="text-sm font-medium text-gray-700 bg-transparent outline-none w-full cursor-pointer appearance-none pr-2" style={{
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
            <button type="button" onClick={() => { setStart(''); setEnd(''); setField('created'); setSelectedHotel(''); load(1, { start:'', end:'', field:'created', selectedHotel: '' }); }} className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
            </button>
            <button className="bg-blue-600 text-white rounded px-4 py-2 text-sm" onClick={() => load(1)}>Filter</button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading refunds...</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {data?.map(b => (
                <div key={b._id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">User:</span>
                      <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      b.refundStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      b.refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
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
                      <span className="text-xs text-gray-500">Total:</span>
                      <div className="text-sm font-semibold">${b.totalPrice}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Refund Amount:</span>
                    <div className="text-sm font-semibold text-blue-600">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</div>
                  </div>
                  {b.refundStatus === 'pending' && (
                      <button 
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm mt-2" 
                        onClick={async () => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Issue refund?')) { await adminIssueRefund(b._id); } }}
                      >
                        Issue Refund
                      </button>
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
                    <th className="py-2">Total</th>
                    <th className="py-2">Refund</th>
                    <th className="py-2">Refund Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="py-2">{b.user?.name || b.user?.username}</td>
                      <td className="py-2">{b.hotel?.name}</td>
                      <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleString() : '-'}</td>
                      <td className="py-2">${b.totalPrice}</td>
                      <td className="py-2">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</td>
                      <td className="py-2">{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}</td>
                      <td className="py-2">
                        {b.refundStatus === 'pending' ? (
                          <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm" onClick={async () => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Issue refund?')) { await adminIssueRefund(b._id); } }}>Issue</button>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Prev</button>
              <div className="text-sm">Page {page} / {Math.max(1, Math.ceil((total || data.length) / limit))}</div>
              <button disabled={page >= Math.ceil((total || data.length) / limit)} onClick={() => load(page + 1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Next</button>
            </div>
          </div>
        )}
      
    </Layout>
  );
}
