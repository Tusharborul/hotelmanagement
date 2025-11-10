import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminRefunds() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getBookings({ start, end, page: p, limit, field: field === 'checkin' ? 'checkin' : undefined });
      // res: { data, total, page }
      let all = res.data || [];

      // Client-side fallback: if filtering by check-in, ensure we filter by booking.checkInDate range
      if (field === 'checkin' && (start || end)) {
        const s = start ? new Date(start) : null;
        const e = end ? (() => { const d = new Date(end); d.setHours(23,59,59,999); return d; })() : null;
        all = (all || []).filter(b => {
          if (!b.checkInDate) return false;
          const d = new Date(b.checkInDate);
          if (s && d < s) return false;
          if (e && d > e) return false;
          return true;
        });
      }

      // keep only bookings that have refunds (refundAmount > 0) or pending refunds
      const refunds = all.filter(b => Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none'));
      setData(refunds);
      // If we applied client-side filtering, set total to the filtered count to reflect UI results
      setTotal((field === 'checkin' && (start || end)) ? refunds.length : (res.total || refunds.length));
      setPage(res.page || p);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const adminIssueRefund = async (bookingId) => {
    try {
      await adminService.issueRefund(bookingId);
      load(page);
      alert('Refund issued');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to issue refund';
      alert(msg);
    }
  };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Refunds">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">Start</label>
            <input type="date" className="border rounded px-3 py-1.5 w-full text-sm"  name="start" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">End</label>
            <input type="date" className="border rounded px-3 py-1.5 w-full text-sm"  name="end" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">Filter by</label>
            <select  name="field" value={field} onChange={(e)=>setField(e.target.value)} className="border rounded px-3 py-1.5 w-full text-sm">
              <option value="created">Created</option>
              <option value="checkin">Check-in</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto text-sm" onClick={() => load(1)}>Filter</button>
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
                      onClick={async () => { if (confirm('Issue refund?')) { await adminIssueRefund(b._id); } }}
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
                          <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm" onClick={async () => { if (confirm('Issue refund?')) { await adminIssueRefund(b._id); } }}>Issue</button>
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
      </div>
    </Layout>
  );
}
