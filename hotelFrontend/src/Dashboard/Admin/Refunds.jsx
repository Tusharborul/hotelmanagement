import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';
import { showToast } from '../../utils/toast';
import { formatDateTime } from '../../utils/date';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatINR } from '../../utils/currency';

export default function AdminRefunds() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);

  // load supports overrides so callers can trigger filtering immediately
  const load = async (p = 1, overrides = {}) => {
    setLoading(true);
    try {
      const sel = overrides.selectedHotel !== undefined ? overrides.selectedHotel : selectedHotel;
      const s = overrides.start !== undefined ? overrides.start : start;
      const e = overrides.end !== undefined ? overrides.end : end;
      const f = overrides.field !== undefined ? overrides.field : field;
      // allow caller to pass hotels list (useful when loading immediately after fetching hotels)
      const hotelsList = overrides.hotels !== undefined ? overrides.hotels : hotels;

      // helper to check date range for createdAt or checkInDate
      const inRange = (b) => {
        if (!s && !e) return true;
        const val = f === 'checkin' ? b.checkInDate : b.createdAt;
        if (!val) return false;
        const d = new Date(val);
        const ss = s ? new Date(s) : null;
        const ee = e ? (() => { const dd = new Date(e); dd.setHours(23,59,59,999); return dd; })() : null;
        if (ss && d < ss) return false;
        if (ee && d > ee) return false;
        return true;
      };

      let all = [];
      if (sel) {
        // load selected hotel bookings and ensure name is available
        const res = await bookingService.getHotelBookings(sel);
        const list = Array.isArray(res) ? res : (res?.data || []);
        const hotelMeta = (hotels || []).find(x => (x._id || x.id) === sel) || {};
        all = (list || []).map(b => {
          const name = (b?.hotel && b.hotel.name) || hotelMeta.name || '';
          const hotel = (b?.hotel && typeof b.hotel === 'object')
            ? { ...b.hotel, name: name || b.hotel.name }
            : { _id: sel, name };
          return { ...b, hotel, hotelName: name };
        });
      } else {
        // aggregate across all hotels (admin-wide): fetch hotels then bookings per hotel
        for (const h of (hotelsList || [])) {
          try {
            const res = await bookingService.getHotelBookings(h._id || h.id);
            const list = Array.isArray(res) ? res : (res?.data || []);
            const mapped = (list || []).map(b => {
              const name = (b?.hotel && b.hotel.name) || h.name || '';
              const hotel = (b?.hotel && typeof b.hotel === 'object')
                ? { ...b.hotel, name: name || b.hotel.name }
                : { _id: h._id || h.id, name };
              return { ...b, hotel, hotelName: name };
            });
            all.push(...mapped);
          } catch (err) {
            console.warn('Failed to load bookings for hotel', h._id || h.id, err);
          }
        }
      }

      // filter refunds and by range
      const refunds = (all || []).filter(b => (Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none')) && inRange(b));

      // pagination: client-side slicing (we aggregated)
      const tot = refunds.length;
      const startIdx = (p - 1) * limit;
      const pageItems = refunds.slice(startIdx, startIdx + limit);

      setData(pageItems);
      setTotal(tot);
      setPage(p);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
      setData([]);
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
        const list = res.data || [];
        setHotels(list);
        // default to All Hotels when hotels are loaded
        setSelectedHotel('');
        // immediately load refunds now that we have hotels available
        load(1, { hotels: list });
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
        <div className="bg-linear-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Refunds Management</div>
        <div>
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
            onReset={() => { setStart(''); setEnd(''); setField('created'); setSelectedHotel(''); load(1, { start: '', end: '', field: 'created', selectedHotel: '' }); }}
            onFilter={() => load(1)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading refunds..." /></div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {data?.map(b => (
                <div key={b._id} className="border-2 border-pink-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-pink-300 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">User:</span>
                      <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                      b.refundStatus === 'completed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                      b.refundStatus === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' :
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
                      <div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Total:</span>
                      <div className="text-sm font-semibold">{formatINR(b.totalPrice)}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Refund Amount:</span>
                    <div className="text-sm font-semibold text-blue-600">{b.refundAmount ? formatINR(Number(b.refundAmount)) : '-'}</div>
                  </div>
                  {b.refundStatus === 'pending' && (
                      <button 
                        className="w-full px-4 py-2.5 bg-linear-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium mt-2 hover:scale-105 transition-transform duration-300 shadow-md" 
                        onClick={async () => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Issue refund?')) { await adminIssueRefund(b._id); } }}
                      >
                        Issue Refund
                      </button>
                    )}
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-linear-to-r from-pink-50 to-rose-50 border-b-2 border-pink-200">
                    <th className="py-4 px-6 font-semibold text-gray-700">User</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Refund</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Refund Status</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-pink-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-gray-800">{b.user?.name || b.user?.username}</td>
                      <td className="py-4 px-6 text-gray-600">{b.hotel?.name}</td>
                      <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                      <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                      <td className="py-4 px-6 font-semibold text-pink-600">{b.refundAmount ? formatINR(Number(b.refundAmount)) : '-'}</td>
                      <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                        (b.refundStatus || 'none') === 'completed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                        (b.refundStatus || 'none') === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}</span></td>
                      <td className="py-4 px-6">
                        {b.refundStatus === 'pending' ? (
                          <button className="px-4 py-2 bg-linear-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-md" onClick={async () => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Issue refund?')) { await adminIssueRefund(b._id); } }}>Issue</button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p)} className="mt-6" />
          </div>
        )}
      
    </Layout>
  );
}
