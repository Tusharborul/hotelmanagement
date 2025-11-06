import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminRefunds() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getBookings({ start, end, page: p, limit });
      // res: { data, total, page }
      const all = res.data || [];
      // keep only bookings that have refunds (refundAmount > 0) or pending refunds
      const refunds = all.filter(b => Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none'));
      setData(refunds);
      setTotal(res.total || refunds.length);
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-600">Start</label>
            <input type="date" className="border rounded px-2 py-1 ml-2" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">End</label>
            <input type="date" className="border rounded px-2 py-1 ml-2" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => load(1)}>Filter</button>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading refunds...</div>
        ) : (
          <div className="overflow-x-auto">
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

            <div className="flex justify-between mt-4">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="border px-3 py-1 rounded disabled:opacity-50">Prev</button>
              <div>Page {page} / {Math.max(1, Math.ceil((total || data.length) / limit))}</div>
              <button disabled={page >= Math.ceil((total || data.length) / limit)} onClick={() => load(page + 1)} className="border px-3 py-1 rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
